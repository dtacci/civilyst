import { getRedisClient } from './redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

// Rate limit configurations based on technical plan
export const RateLimits = {
  ANONYMOUS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  FREE_USER: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  PRO_USER: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300,
  },
  API_KEY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },
  EXPENSIVE_OPERATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Cost-based throttling
  },
} as const;

// Rate limiting implementation using sliding window
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  // If Redis is not available, allow the request (graceful degradation)
  if (!redis) {
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
      totalRequests: 1,
    };
  }

  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use sliding window log approach
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    const currentRequests = await redis.zcard(key);

    if (currentRequests >= config.maxRequests) {
      // Get the oldest request time to calculate reset time
      const oldestRequests = (await redis.zrange(key, 0, 0, {
        withScores: true,
      })) as Array<{ value: string; score: number }>;
      const resetTime =
        oldestRequests.length > 0
          ? oldestRequests[0].score + config.windowMs
          : now + config.windowMs;

      return {
        success: false,
        remaining: 0,
        resetTime,
        totalRequests: currentRequests,
      };
    }

    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiration for cleanup
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      success: true,
      remaining: config.maxRequests - currentRequests - 1,
      resetTime: now + config.windowMs,
      totalRequests: currentRequests + 1,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, allow the request (fail open)
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
      totalRequests: 1,
    };
  }
}

// Utility to get rate limit key based on user context
export function getRateLimitIdentifier(
  userId?: string,
  ip?: string,
  apiKey?: string
): string {
  if (apiKey) return `api:${apiKey}`;
  if (userId) return `user:${userId}`;
  if (ip) return `ip:${ip}`;
  return 'anonymous';
}

// Get appropriate rate limit config based on user type
export function getRateLimitConfig(
  userType: 'anonymous' | 'free' | 'pro' | 'api',
  isExpensiveOperation = false
): RateLimitConfig {
  if (isExpensiveOperation) {
    return RateLimits.EXPENSIVE_OPERATION;
  }

  switch (userType) {
    case 'anonymous':
      return RateLimits.ANONYMOUS;
    case 'free':
      return RateLimits.FREE_USER;
    case 'pro':
      return RateLimits.PRO_USER;
    case 'api':
      return RateLimits.API_KEY;
    default:
      return RateLimits.ANONYMOUS;
  }
}
