import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';

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
