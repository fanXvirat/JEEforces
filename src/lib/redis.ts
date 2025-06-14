

import { Redis } from 'ioredis';


const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  
  throw new Error('REDIS_URL is not defined. Please check your environment variables.');
}


declare global {
  var redis: Redis | undefined;
}


const redis = global.redis ?? new Redis(REDIS_URL);


redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis connected successfully!'));

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

export default redis;