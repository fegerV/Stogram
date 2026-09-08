"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lenientIPRateLimit = exports.moderateIPRateLimit = exports.strictIPRateLimit = exports.createIPRateLimiter = exports.IPRateLimiter = void 0;
const auditLogService_1 = require("../services/auditLogService");
let redis = null;
// Only initialize Redis if REDIS_URL is provided
if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    try {
        const Redis = require('ioredis');
        redis = new Redis(process.env.REDIS_URL);
    }
    catch (error) {
        console.warn('Redis not available, IP rate limiting will use memory store');
    }
}
// In-memory store for development
const memoryStore = new Map();
// Cleanup expired entries without blocking process exit in tests/dev
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
        if (now > value.expires) {
            memoryStore.delete(key);
        }
    }
}, 60000); // Cleanup every minute
cleanupInterval.unref?.();
/**
 * IP-based rate limiting middleware using Redis
 * Tracks requests per IP address regardless of authentication status
 */
class IPRateLimiter {
    constructor(options) {
        /**
         * Middleware function
         */
        this.middleware = async (req, res, next) => {
            const ip = this.getClientIP(req);
            const path = req.path;
            const key = this.getKey(ip, path);
            try {
                let currentCount;
                let ttl;
                let resetTime;
                if (redis) {
                    // Redis implementation
                    currentCount = await redis.incr(key);
                    // Set expiry on first request
                    if (currentCount === 1) {
                        await redis.pexpire(key, this.options.windowMs);
                    }
                    // Get TTL for retry-after header
                    ttl = await redis.pttl(key);
                    resetTime = Date.now() + ttl;
                }
                else {
                    // Memory store implementation
                    const now = Date.now();
                    const existing = memoryStore.get(key);
                    if (existing && now < existing.expires) {
                        currentCount = existing.count + 1;
                        existing.count = currentCount;
                    }
                    else {
                        currentCount = 1;
                        memoryStore.set(key, {
                            count: 1,
                            expires: now + this.options.windowMs
                        });
                    }
                    ttl = this.options.windowMs;
                    resetTime = now + ttl;
                }
                // Set rate limit headers
                res.setHeader('X-RateLimit-Limit', this.options.maxRequests.toString());
                res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.maxRequests - currentCount).toString());
                res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
                // Check if limit exceeded
                if (currentCount > this.options.maxRequests) {
                    res.setHeader('Retry-After', Math.ceil(ttl / 1000).toString());
                    // Log rate limit exceeded
                    const userId = req.userId;
                    await auditLogService_1.AuditLogService.logRateLimitExceeded(ip, path, userId);
                    res.status(429).json({
                        error: 'Too many requests from this IP',
                        message: `Rate limit exceeded. Please try again in ${Math.ceil(ttl / 1000)} seconds.`,
                        retryAfter: Math.ceil(ttl / 1000),
                    });
                    return;
                }
                next();
            }
            catch (error) {
                console.error('IP Rate limiter error:', error);
                // On error, allow the request to proceed
                next();
            }
        };
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
    getClientIP(req) {
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
    getKey(ip, path) {
        return `${this.options.keyPrefix}:${ip}:${path}`;
    }
    /**
     * Reset rate limit for specific IP
     */
    static async resetIP(ip, path = '*') {
        try {
            if (redis) {
                if (path === '*') {
                    const pattern = `ip-ratelimit:${ip}:*`;
                    const keys = await redis.keys(pattern);
                    if (keys.length > 0) {
                        await redis.del(...keys);
                    }
                }
                else {
                    const key = `ip-ratelimit:${ip}:${path}`;
                    await redis.del(key);
                }
            }
            else {
                // Memory store implementation
                const now = Date.now();
                if (path === '*') {
                    for (const [key, value] of memoryStore.entries()) {
                        if (key.startsWith(`ip-ratelimit:${ip}:`) && now < value.expires) {
                            memoryStore.delete(key);
                        }
                    }
                }
                else {
                    const key = `ip-ratelimit:${ip}:${path}`;
                    memoryStore.delete(key);
                }
            }
        }
        catch (error) {
            console.error('Reset IP rate limit error:', error);
        }
    }
    /**
     * Get current count for IP
     */
    static async getCount(ip, path) {
        try {
            const key = `ip-ratelimit:${ip}:${path}`;
            if (redis) {
                const count = await redis.get(key);
                return count ? parseInt(count, 10) : 0;
            }
            else {
                // Memory store implementation
                const now = Date.now();
                const existing = memoryStore.get(key);
                if (existing && now < existing.expires) {
                    return existing.count;
                }
                return 0;
            }
        }
        catch (error) {
            console.error('Get IP count error:', error);
            return 0;
        }
    }
}
exports.IPRateLimiter = IPRateLimiter;
/**
 * Create IP rate limiter middleware with common presets
 */
const createIPRateLimiter = (options) => {
    const limiter = new IPRateLimiter(options);
    return limiter.middleware;
};
exports.createIPRateLimiter = createIPRateLimiter;
/**
 * Preset: Strict rate limit for authentication endpoints
 */
exports.strictIPRateLimit = (0, exports.createIPRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'strict-ip-limit',
});
/**
 * Preset: Moderate rate limit for API endpoints
 */
exports.moderateIPRateLimit = (0, exports.createIPRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyPrefix: 'moderate-ip-limit',
});
/**
 * Preset: Lenient rate limit for general use
 */
exports.lenientIPRateLimit = (0, exports.createIPRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    keyPrefix: 'lenient-ip-limit',
});
//# sourceMappingURL=ipRateLimit.js.map