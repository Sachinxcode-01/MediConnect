import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis } from '../../config/redis.js';

// Tier 1: User-based limiter (10 queries per 15 minutes)
const userTriageLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_triage_user',
  points: 10,
  duration: 15 * 60,
  blockDuration: 15 * 60,
  insuranceLimiter: new RateLimiterMemory({
    points: 10,
    duration: 15 * 60,
  }),
});

// Tier 2: IP-based fallback & DDoS shield (30 queries per 15 minutes)
const ipTriageLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_triage_ip',
  points: 30,
  duration: 15 * 60,
  blockDuration: 30 * 60,
  insuranceLimiter: new RateLimiterMemory({
    points: 30,
    duration: 15 * 60,
  }),
});

export const triageRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id;
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';

  try {
    // 1. Enforce IP limit
    await ipTriageLimiter.consume(clientIp);

    // 2. If authenticated, enforce strict user limit
    if (userId) {
      await userTriageLimiter.consume(userId);
    }

    next();
  } catch (rejRes: any) {
    const retrySecs = Math.round((rejRes?.msBeforeNext || 60000) / 1000) || 60;
    res.setHeader('Retry-After', String(retrySecs));
    res.status(429).json({
      status: 'TooManyRequests',
      error: 'AI Triage rate limit exceeded. Please wait before submitting additional symptoms.',
      retryAfterSeconds: retrySecs,
    });
  }
};
