import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

export class CacheMiddleware {
  // Cache middleware for GET requests
  static cache(options: CacheOptions = {}) {
    const { ttl = 300, keyPrefix = 'cache' } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `${keyPrefix}:${req.originalUrl}`;

      try {
        const cachedData = await redis.get(key);

        if (cachedData) {
          console.log(`Cache hit for: ${key}`);
          return res.json(JSON.parse(cachedData));
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to cache response
        res.json = function (data: any) {
          redis.setex(key, ttl, JSON.stringify(data));
          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Invalidate cache by pattern
  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Clear all cache
  static async clearAll(): Promise<void> {
    try {
      await redis.flushall();
      console.log('All cache cleared');
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  // Set cache value manually
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Set cache error:', error);
    }
  }

  // Get cache value manually
  static async get(key: string): Promise<any | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get cache error:', error);
      return null;
    }
  }

  // Delete cache value
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Delete cache error:', error);
    }
  }

  // Cache chat messages
  static async cacheMessages(chatId: string, messages: any[]): Promise<void> {
    const key = `messages:${chatId}`;
    await this.set(key, messages, 600); // 10 minutes
  }

  // Get cached messages
  static async getCachedMessages(chatId: string): Promise<any[] | null> {
    const key = `messages:${chatId}`;
    return await this.get(key);
  }

  // Invalidate messages cache
  static async invalidateMessages(chatId: string): Promise<void> {
    await this.delete(`messages:${chatId}`);
  }

  // Cache user data
  static async cacheUser(userId: string, userData: any): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, userData, 1800); // 30 minutes
  }

  // Get cached user
  static async getCachedUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  // Rate limiting using Redis
  static rateLimit(options: { max: number; windowMs: number }) {
    const { max, windowMs } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `ratelimit:${ip}:${req.path}`;

      try {
        const current = await redis.incr(key);

        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }

        if (current > max) {
          return res.status(429).json({
            error: 'Too many requests',
            retryAfter: await redis.ttl(key),
          });
        }

        next();
      } catch (error) {
        console.error('Rate limit error:', error);
        next();
      }
    };
  }

  // Session cache
  static async cacheSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, data, ttl);
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.delete(key);
  }

  // Pub/Sub for real-time updates
  static async publish(channel: string, message: any): Promise<void> {
    try {
      await redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('Publish error:', error);
    }
  }

  static subscribe(channel: string, callback: (message: any) => void): void {
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error('Subscribe error:', err);
        return;
      }
      console.log(`Subscribed to channel: ${channel}`);
    });

    subscriber.on('message', (chan, msg) => {
      if (chan === channel) {
        try {
          const data = JSON.parse(msg);
          callback(data);
        } catch (error) {
          console.error('Parse message error:', error);
        }
      }
    });
  }

  // Distributed lock
  static async acquireLock(
    resource: string,
    ttl: number = 10000
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = Math.random().toString(36);
    
    const result = await redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
    return result === 'OK' ? lockValue : null;
  }

  static async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }
}

export default CacheMiddleware;
