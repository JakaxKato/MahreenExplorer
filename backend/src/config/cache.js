import { Redis } from '@upstash/redis';

let redisClient;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
}

export async function getCached(key) {
  if (!redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.warn('Redis cache read failed:', error.message);
    return null;
  }
}

export async function setCached(key, value) {
  if (!redisClient) return;
  try {
    await redisClient.set(key, value, { ex: 60 });
  } catch (error) {
    console.warn('Redis cache write failed:', error.message);
  }
}
