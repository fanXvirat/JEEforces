import { Redis } from 'ioredis';

let redis: Redis;

declare global {
  var _redis: Redis | undefined;
}

const isProd = process.env.NODE_ENV === 'production';

const REDIS_URL = isProd
  ? process.env.REDIS_URL
  : process.env.LOCAL_REDIS_URL || 'redis://localhost:6379';

if (!REDIS_URL) {
  throw new Error('No Redis URL found');
}

if (isProd) {
  redis = new Redis(REDIS_URL);
} else {
  if (!global._redis) {
    global._redis = new Redis(REDIS_URL);
  }
  redis = global._redis;
}

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis connected!'));

export default redis;
