import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../services/queueService';
import { RateLimiterService } from '../services/rateLimiter';
import { sendEmail } from '../services/emailService';
import { SlackService } from '../services/slackService';
import { updateEmailDocumentStatus } from '../config/elasticsearch';
import { db } from '../config/database';

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const data = job.data;
      console.log(`\n⏳ [Worker] Processing email job ${job.id} for recipient: ${data.recipientEmail}`);

      // 1. Check if job was cancelled
      const emailRecord = db.prepare('SELECT status FROM scheduled_emails WHERE id = ?').get(data.emailId) as any;
      if (!emailRecord || emailRecord.status === 'Cancelled') {
        console.log(`ℹ Job ${job.id} was cancelled. Skipping.`);
        return { status: 'Cancelled' };
      }

      // 2. Check Hourly Rate Limit
      const rateLimitCheck = await RateLimiterService.checkHourlyLimit(data.userId, data.hourlyLimit);
      if (!rateLimitCheck.allowed) {
        console.warn(`⚠️ Rate limit exceeded for user ${data.userId}. Re-scheduling in ${rateLimitCheck.resetInSeconds}s`);
        // Delay job until next hour bucket
        await job.moveToDelayed(Date.now() + rateLimitCheck.resetInSeconds * 1000, job.token!);
        return { status: 'RateLimited', retryIn: rateLimitCheck.resetInSeconds };
      }

      // 3. Enforce per-email spacing delay (EMAIL_SEND_DELAY_MS)
      if (data.delayMs > 0) {
        await RateLimiterService.enforceDelay(data.senderId, data.delayMs);
      }

      // 4. Update status to Sending
      db.prepare('UPDATE scheduled_emails SET status = ? WHERE id = ?').run('Sending', data.emailId);

      try {
        // 5. Send via Ethereal / SMTP Transporter
        const sendResult = await sendEmail({
          from: `"${data.senderName}" <${data.senderEmail}>`,
          to: data.recipientEmail,
          subject: data.subject,
          html: data.body,
        });

        const sentAt = new Date().toISOString();
        const previewUrl = sendResult.previewUrl || '';

        // 6. Update DB to Sent
        db.prepare(`
          UPDATE scheduled_emails 
          SET status = 'Sent', sent_at = ?, preview_url = ? 
          WHERE id = ?
        `).run(sentAt, previewUrl, data.emailId);

        // 7. Update Elasticsearch document
        await updateEmailDocumentStatus(data.emailId, 'Sent', sentAt, previewUrl);

        // 8. Trigger Live Slack Notification
        await SlackService.notify(data.userId, 'SENT', {
          recipient: data.recipientEmail,
          subject: data.subject,
          previewUrl: previewUrl || undefined,
          campaignId: data.campaignId,
        });

        console.log(`✅ [Worker] Email sent to ${data.recipientEmail}. Preview: ${previewUrl}`);
        return { status: 'Sent', messageId: sendResult.messageId, previewUrl };
      } catch (err: any) {
        console.error(`❌ [Worker] Failed to send email to ${data.recipientEmail}:`, err.message);

        // Update DB to Failed
        db.prepare(`
          UPDATE scheduled_emails 
          SET status = 'Failed', error_message = ? 
          WHERE id = ?
        `).run(err.message, data.emailId);

        await updateEmailDocumentStatus(data.emailId, 'Failed');

        await SlackService.notify(data.userId, 'FAILED', {
          recipient: data.recipientEmail,
          subject: data.subject,
          error: err.message,
        });

        throw err;
      }
    },
    {
      connection: redisConnectionOptions,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✓ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.warn(`! Job ${job?.id} failed: ${err.message}`);
  });

  console.log('✓ BullMQ Email Worker started and ready');
  return worker;
}
