import { Request, Response, NextFunction } from 'express';
interface CacheOptions {
    ttl?: number;
    keyPrefix?: string;
}
export declare class CacheMiddleware {
    static cache(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static invalidate(pattern: string): Promise<void>;
    static clearAll(): Promise<void>;
    static set(key: string, value: any, ttl?: number): Promise<void>;
    static get(key: string): Promise<any | null>;
    static delete(key: string): Promise<void>;
    static cacheMessages(chatId: string, messages: any[]): Promise<void>;
    static getCachedMessages(chatId: string): Promise<any[] | null>;
    static invalidateMessages(chatId: string): Promise<void>;
    static cacheUser(userId: string, userData: any): Promise<void>;
    static getCachedUser(userId: string): Promise<any | null>;
    static rateLimit(options: {
        max: number;
        windowMs: number;
    }): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    static cacheSession(sessionId: string, data: any, ttl?: number): Promise<void>;
    static getSession(sessionId: string): Promise<any | null>;
    static deleteSession(sessionId: string): Promise<void>;
    static publish(channel: string, message: any): Promise<void>;
    static subscribe(channel: string, callback: (message: any) => void): void;
    static acquireLock(resource: string, ttl?: number): Promise<string | null>;
    static releaseLock(resource: string, lockValue: string): Promise<boolean>;
}
export default CacheMiddleware;
//# sourceMappingURL=cache.d.ts.map