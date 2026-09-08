import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env.js';

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 3000);
    if (times > 10) {
      console.warn('⚠️ [Redis] Reconnected more than 10 times. Backing off...');
    }
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

export const redis = new Redis(env.REDIS_URI, redisOptions);

redis.on('connect', () => {
  console.log('✅ [Redis] Connection initiated');
});

redis.on('ready', () => {
  console.log('🚀 [Redis] Client ready and connected');
});

redis.on('error', (err: Error) => {
  console.error('❌ [Redis] Client error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️ [Redis] Connection closed');
});

export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.quit();
    } else {
      redis.disconnect();
    }
    console.log('🔌 [Redis] Disconnected gracefully');
  } catch (error) {
    console.error('❌ [Redis] Error during disconnection:', error);
    redis.disconnect();
  }
}

