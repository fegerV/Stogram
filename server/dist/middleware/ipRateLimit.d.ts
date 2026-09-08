import { Request, Response, NextFunction } from 'express';
export interface IPRateLimitOptions {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyPrefix?: string;
}
/**
 * IP-based rate limiting middleware using Redis
 * Tracks requests per IP address regardless of authentication status
 */
export declare class IPRateLimiter {
    private options;
    constructor(options: IPRateLimitOptions);
    /**
     * Get client IP address from request
     */
    private getClientIP;
    /**
     * Get rate limit key for IP
     */
    private getKey;
    /**
     * Middleware function
     */
    middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Reset rate limit for specific IP
     */
    static resetIP(ip: string, path?: string): Promise<void>;
    /**
     * Get current count for IP
     */
    static getCount(ip: string, path: string): Promise<number>;
}
/**
 * Create IP rate limiter middleware with common presets
 */
export declare const createIPRateLimiter: (options: IPRateLimitOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Preset: Strict rate limit for authentication endpoints
 */
export declare const strictIPRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Preset: Moderate rate limit for API endpoints
 */
export declare const moderateIPRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Preset: Lenient rate limit for general use
 */
export declare const lenientIPRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ipRateLimit.d.ts.map