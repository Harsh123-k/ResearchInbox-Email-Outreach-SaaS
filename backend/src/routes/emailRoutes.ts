import { Router } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db } from '../config/database';
import { addEmailJob, removeEmailJob } from '../services/queueService';
import { searchEmails, indexEmailDocument } from '../config/elasticsearch';
import { SlackService } from '../services/slackService';

const upload = multer({ dest: 'uploads/' });
export const emailRouter = Router();

// 1. Schedule Email Campaign
emailRouter.post('/schedule', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      senderId,
      recipients,
      subject,
      body,
      startTime,
      delayMs = 2000,
      hourlyLimit = 200,
    } = req.body;

    if (!senderId) return res.status(400).json({ error: 'Sender selection is required' });
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'At least one recipient email is required' });
    }
    if (!subject || subject.trim() === '') return res.status(400).json({ error: 'Subject line is required' });
    if (!body || body.trim() === '') return res.status(400).json({ error: 'Email body is required' });
    if (!startTime) return res.status(400).json({ error: 'Start time is required' });

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start time format' });
    }

    const now = Date.now();
    const startMs = startDate.getTime();

    // Verify sender
    let sender = db.prepare('SELECT * FROM senders WHERE id = ? AND user_id = ?').get(senderId, userId) as any;
    if (!sender) {
      sender = db.prepare('SELECT * FROM senders WHERE user_id = ? LIMIT 1').get(userId) as any;
      if (!sender) {
        // Fallback user sender
        sender = {
          id: 'snd_' + Date.now(),
          name: req.user!.name,
          email: req.user!.email,
        };
      }
    }

    const campaignId = 'cmp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    db.prepare(`
      INSERT INTO email_campaigns (id, user_id, sender_id, subject, body, start_time, delay_ms, hourly_limit, total_recipients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(campaignId, userId, sender.id, subject, body, startDate.toISOString(), delayMs, hourlyLimit, recipients.length);

    const scheduledList: any[] = [];

    // Deduplicate recipients
    const uniqueRecipients = Array.from(new Set(recipients.map((r: string) => r.trim().toLowerCase())));

    for (let i = 0; i < uniqueRecipients.length; i++) {
      const recipientEmail = uniqueRecipients[i];
      if (!recipientEmail || !recipientEmail.includes('@')) continue;

      const emailId = 'eml_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6);
      
      // Calculate schedule time with spacing delay
      const itemDelayMs = Math.max(0, startMs - now) + (i * delayMs);
      const scheduledTimeIso = new Date(now + itemDelayMs).toISOString();

      // Enqueue in BullMQ
      const bullJobId = await addEmailJob(
        {
          emailId,
          campaignId,
          userId,
          senderId: sender.id,
          senderName: sender.name,
          senderEmail: sender.email,
          recipientEmail,
          subject,
          body,
          delayMs,
          hourlyLimit,
          scheduledTime: scheduledTimeIso,
        },
        itemDelayMs
      );

      // Save to SQLite DB
      db.prepare(`
        INSERT INTO scheduled_emails (id, campaign_id, user_id, sender_id, sender_email, sender_name, recipient_email, subject, body, status, scheduled_time, bull_job_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?, ?)
      `).run(
        emailId,
        campaignId,
        userId,
        sender.id,
        sender.email,
        sender.name,
        recipientEmail,
        subject,
        body,
        scheduledTimeIso,
        bullJobId
      );

      // Index in Elasticsearch
      const doc = {
        id: emailId,
        user_id: userId,
        recipient_email: recipientEmail,
        subject,
        body,
        sender_email: sender.email,
        sender_name: sender.name,
        status: 'Scheduled',
        scheduled_time: scheduledTimeIso,
        created_at: new Date().toISOString(),
      };
      await indexEmailDocument(doc);

      scheduledList.push(doc);
    }

    // Trigger Live Slack Notification for scheduled campaign
    await SlackService.notify(userId, 'SCHEDULED', {
      recipient: uniqueRecipients.length === 1 ? uniqueRecipients[0] : `${uniqueRecipients[0]} + ${uniqueRecipients.length - 1} more`,
      subject,
      scheduledTime: startDate.toISOString(),
      campaignId,
    });

    res.json({
      success: true,
      message: `Successfully scheduled ${scheduledList.length} emails`,
      campaignId,
      scheduledCount: scheduledList.length,
      emails: scheduledList,
    });
  } catch (err: any) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Scheduled Emails
emailRouter.get('/scheduled', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const emails = db.prepare(`
    SELECT * FROM scheduled_emails 
    WHERE user_id = ? AND status IN ('Scheduled', 'Sending')
    ORDER BY scheduled_time ASC
  `).all(userId);
  res.json({ emails });
});

// 3. Get Sent Emails
emailRouter.get('/sent', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const emails = db.prepare(`
    SELECT * FROM scheduled_emails 
    WHERE user_id = ? AND status IN ('Sent', 'Failed', 'Cancelled')
    ORDER BY COALESCE(sent_at, created_at) DESC
  `).all(userId);
  res.json({ emails });
});

// 4. Elasticsearch Multi-Field Search Endpoint
emailRouter.get('/search', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const q = (req.query.q as string) || '';
    const results = await searchEmails(userId, q);
    res.json({ query: q, total: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Email Detail
emailRouter.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const email = db.prepare('SELECT * FROM scheduled_emails WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!email) return res.status(404).json({ error: 'Email not found' });
  res.json({ email });
});

// 6. Cancel Scheduled Email
emailRouter.post('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const email = db.prepare('SELECT * FROM scheduled_emails WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!email) return res.status(404).json({ error: 'Email not found' });

  if (email.status !== 'Scheduled') {
    return res.status(400).json({ error: `Cannot cancel email with status '${email.status}'` });
  }

  if (email.bull_job_id) {
    await removeEmailJob(email.bull_job_id);
  }

  db.prepare("UPDATE scheduled_emails SET status = 'Cancelled' WHERE id = ?").run(email.id);
  res.json({ success: true, message: 'Email cancelled successfully' });
});

// 7. CSV / TXT Upload Parser
emailRouter.post('/upload-csv', authenticateToken, upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const rawEmails: string[] = [];

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  fs.unlinkSync(filePath); // clean temp file

  const matches = fileContent.match(emailRegex) || [];
  const validEmails: string[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  matches.forEach((email) => {
    const clean = email.toLowerCase().trim();
    if (seen.has(clean)) {
      duplicateCount++;
    } else {
      seen.add(clean);
      validEmails.push(clean);
    }
  });

  res.json({
    totalDetected: matches.length,
    validCount: validEmails.length,
    invalidCount: 0,
    duplicateCount,
    emails: validEmails,
  });
});
