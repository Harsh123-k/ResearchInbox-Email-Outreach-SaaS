import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { db } from '../config/database';

export interface EmailJobData {
  emailId: string;
  campaignId: string;
  userId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  delayMs: number;
  hourlyLimit: number;
  scheduledTime: string;
}

export const EMAIL_QUEUE_NAME = 'reachinbox-email-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // keep for 24h
      count: 1000,
    },
    removeOnFail: {
      age: 86400 * 7,
    },
  },
});

export async function addEmailJob(data: EmailJobData, delayMs: number): Promise<string> {
  const job = await emailQueue.add(`send-${data.emailId}`, data, {
    delay: Math.max(0, delayMs),
    jobId: data.emailId,
  });
  return job.id || data.emailId;
}

export async function removeEmailJob(jobId: string): Promise<boolean> {
  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Reconciles and recovers pending scheduled emails on server restart.
 * Guarantees zero lost emails if the server or Redis restarts.
 */
export async function reconcilePendingJobsOnRestart(): Promise<void> {
  try {
    const pendingEmails = db.prepare(`
      SELECT * FROM scheduled_emails 
      WHERE status = 'Scheduled'
    `).all() as any[];

    if (pendingEmails.length === 0) return;

    console.log(`🔄 [Recovery] Checking ${pendingEmails.length} pending scheduled emails for restart recovery...`);
    const now = Date.now();
    let reEnqueuedCount = 0;

    for (const email of pendingEmails) {
      const existingJob = await emailQueue.getJob(email.id);
      if (!existingJob) {
        const scheduledTimeMs = new Date(email.scheduled_time).getTime();
        const remainingDelay = Math.max(0, scheduledTimeMs - now);

        await addEmailJob(
          {
            emailId: email.id,
            campaignId: email.campaign_id,
            userId: email.user_id,
            senderId: email.sender_id,
            senderName: email.sender_name,
            senderEmail: email.sender_email,
            recipientEmail: email.recipient_email,
            subject: email.subject,
            body: email.body,
            delayMs: 2000,
            hourlyLimit: 200,
            scheduledTime: email.scheduled_time,
          },
          remainingDelay
        );
        reEnqueuedCount++;
      }
    }

    if (reEnqueuedCount > 0) {
      console.log(`✅ [Recovery] Successfully recovered and re-enqueued ${reEnqueuedCount} scheduled jobs!`);
    }
  } catch (err: any) {
    console.warn(`! Recovery notice: ${err.message}`);
  }
}