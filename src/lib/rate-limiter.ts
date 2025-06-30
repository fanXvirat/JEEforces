import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '5 m'), // 10 requests per 10 seconds
  analytics: false
});
export const agentlimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(1, '60s'), // 10 requests per 10 seconds
    analytics: false
})