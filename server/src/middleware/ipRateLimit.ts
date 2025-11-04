import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { AuditLogService } from '../services/auditLogService';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface IPRateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyPrefix?: string;
}

/**
 * IP-based rate limiting middleware using Redis
 * Tracks requests per IP address regardless of authentication status
 */
export class IPRateLimiter {
  private options: Required<IPRateLimitOptions>;

  constructor(options: IPRateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyPrefix: 'ip-ratelimit',
      ...options,
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string {
    // Check for proxy headers
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Get rate limit key for IP
   */
  private getKey(ip: string, path: string): string {
    return `${this.options.keyPrefix}:${ip}:${path}`;
  }

  /**
   * Middleware function
   */
  middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = this.getClientIP(req);
    const path = req.path;
    const key = this.getKey(ip, path);

    try {
      // Get current count
      const currentCount = await redis.incr(key);

      // Set expiry on first request
      if (currentCount === 1) {
        await redis.pexpire(key, this.options.windowMs);
      }

      // Get TTL for retry-after header
      const ttl = await redis.pttl(key);
      const resetTime = Date.now() + ttl;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.maxRequests - currentCount).toString());
      res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

      // Check if limit exceeded
      if (currentCount > this.options.maxRequests) {
        res.setHeader('Retry-After', Math.ceil(ttl / 1000).toString());

        // Log rate limit exceeded
        const userId = (req as any).userId;
        await AuditLogService.logRateLimitExceeded(ip, path, userId);

        res.status(429).json({
          error: 'Too many requests from this IP',
          message: `Rate limit exceeded. Please try again in ${Math.ceil(ttl / 1000)} seconds.`,
          retryAfter: Math.ceil(ttl / 1000),
        });
        return;
      }

      next();
    } catch (error) {
      console.error('IP Rate limiter error:', error);
      // On error, allow the request to proceed
      next();
    }
  };

  /**
   * Reset rate limit for specific IP
   */
  static async resetIP(ip: string, path: string = '*'): Promise<void> {
    try {
      if (path === '*') {
        const pattern = `ip-ratelimit:${ip}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        const key = `ip-ratelimit:${ip}:${path}`;
        await redis.del(key);
      }
    } catch (error) {
      console.error('Reset IP rate limit error:', error);
    }
  }

  /**
   * Get current count for IP
   */
  static async getCount(ip: string, path: string): Promise<number> {
    try {
      const key = `ip-ratelimit:${ip}:${path}`;
      const count = await redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Get IP count error:', error);
      return 0;
    }
  }
}

/**
 * Create IP rate limiter middleware with common presets
 */
export const createIPRateLimiter = (options: IPRateLimitOptions) => {
  const limiter = new IPRateLimiter(options);
  return limiter.middleware;
};

/**
 * Preset: Strict rate limit for authentication endpoints
 */
export const strictIPRateLimit = createIPRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'strict-ip-limit',
});

/**
 * Preset: Moderate rate limit for API endpoints
 */
export const moderateIPRateLimit = createIPRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'moderate-ip-limit',
});

/**
 * Preset: Lenient rate limit for general use
 */
export const lenientIPRateLimit = createIPRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  keyPrefix: 'lenient-ip-limit',
});
