import { Client } from '@elastic/elasticsearch';
import { db } from './database';

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
export const EMAIL_INDEX = 'reachinbox_emails';

export const esClient = new Client({
  node: ELASTICSEARCH_NODE,
  requestTimeout: 3000,
  maxRetries: 1,
});

let isElasticsearchHealthy = false;

export async function initElasticsearch() {
  try {
    const health = await esClient.cluster.health({});
    isElasticsearchHealthy = true;
    console.log(`✓ Connected to Elasticsearch (status: ${health.status})`);

    const indexExists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              user_id: { type: 'keyword' },
              recipient_email: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              subject: { type: 'text' },
              body: { type: 'text' },
              sender_email: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              sender_name: { type: 'text' },
              status: { type: 'keyword' },
              scheduled_time: { type: 'date' },
              sent_at: { type: 'date' },
              created_at: { type: 'date' },
            },
          },
        },
      });
      console.log(`✓ Elasticsearch index '${EMAIL_INDEX}' created successfully`);
    }
  } catch (err: any) {
    isElasticsearchHealthy = false;
    console.log(`ℹ Elasticsearch server offline/unavailable at ${ELASTICSEARCH_NODE}. Using integrated SQLite indexer for full text search.`);
  }
}

export async function indexEmailDocument(emailDoc: {
  id: string;
  user_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sender_email: string;
  sender_name: string;
  status: string;
  scheduled_time: string;
  sent_at?: string;
  created_at: string;
}) {
  if (isElasticsearchHealthy) {
    try {
      await esClient.index({
        index: EMAIL_INDEX,
        id: emailDoc.id,
        document: emailDoc,
        refresh: 'wait_for',
      });
    } catch (err: any) {
      console.warn(`! Elasticsearch index error: ${err.message}`);
    }
  }
}

export async function updateEmailDocumentStatus(id: string, status: string, sent_at?: string, preview_url?: string) {
  if (isElasticsearchHealthy) {
    try {
      await esClient.update({
        index: EMAIL_INDEX,
        id,
        doc: {
          status,
          sent_at,
          preview_url,
        },
      });
    } catch (err: any) {
      console.warn(`! Elasticsearch update error: ${err.message}`);
    }
  }
}

export async function searchEmails(userId: string, query: string) {
  if (!query || query.trim() === '') {
    // Return all for user
    const stmt = db.prepare(`
      SELECT * FROM scheduled_emails 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    return stmt.all(userId);
  }

  const cleanQuery = query.trim();

  // If Elasticsearch is healthy, search ES
  if (isElasticsearchHealthy) {
    try {
      const result = await esClient.search({
        index: EMAIL_INDEX,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                {
                  multi_match: {
                    query: cleanQuery,
                    fields: ['recipient_email^3', 'subject^2', 'body', 'sender_email', 'sender_name'],
                    fuzziness: 'AUTO',
                  },
                },
              ],
            },
          },
          sort: [{ created_at: { order: 'desc' } }],
          size: 100,
        },
      });

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (err: any) {
      console.warn(`! Elasticsearch search error: ${err.message}, falling back to DB full text search`);
    }
  }

  // Resilient DB search across recipient_email, subject, body, sender_email
  const wildcard = `%${cleanQuery}%`;
  const stmt = db.prepare(`
    SELECT * FROM scheduled_emails 
    WHERE user_id = ? AND (
      recipient_email LIKE ? OR 
      subject LIKE ? OR 
      body LIKE ? OR 
      sender_email LIKE ? OR 
      sender_name LIKE ?
    )
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return stmt.all(userId, wildcard, wildcard, wildcard, wildcard, wildcard);
}
