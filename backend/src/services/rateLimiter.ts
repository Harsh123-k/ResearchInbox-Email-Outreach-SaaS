import { redisClient } from '../config/redis';

export class RateLimiterService {
  /**
   * Check if sending an email for a user exceeds the hourly rate limit
   */
  static async checkHourlyLimit(userId: string, hourlyLimit: number): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
    try {
      const now = new Date();
      // Hour bucket key: ratelimit:{userId}:{YYYY-MM-DD-HH}
      const hourKey = `ratelimit:${userId}:${now.toISOString().slice(0, 13)}`;
      
      const currentCount = await redisClient.incr(hourKey);
      
      if (currentCount === 1) {
        // Set TTL to 1 hour (3600 seconds)
        await redisClient.expire(hourKey, 3600);
      }

      const ttl = await redisClient.ttl(hourKey);
      const remaining = Math.max(0, hourlyLimit - currentCount);

      if (currentCount > hourlyLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetInSeconds: ttl > 0 ? ttl : 3600,
        };
      }

      return {
        allowed: true,
        remaining,
        resetInSeconds: ttl > 0 ? ttl : 3600,
      };
    } catch (err: any) {
      console.warn(`! Rate limiter warning: ${err.message}. Defaulting to allowed.`);
      return { allowed: true, remaining: hourlyLimit, resetInSeconds: 3600 };
    }
  }

  /**
   * Enforce delay spacing between consecutive emails for the same sender
   */
  static async enforceDelay(senderId: string, delayMs: number): Promise<void> {
    if (delayMs <= 0) return;
    
    try {
      const lastSentKey = `last_sent:${senderId}`;
      const lastSentTime = await redisClient.get(lastSentKey);
      const now = Date.now();

      if (lastSentTime) {
        const elapsed = now - parseInt(lastSentTime, 10);
        if (elapsed < delayMs) {
          const waitTime = delayMs - elapsed;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      await redisClient.set(lastSentKey, Date.now().toString(), 'EX', 3600);
    } catch (err) {
      // Fallback delay
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
