import { Request } from 'express';
interface SecurityLogData {
    userId: string;
    action: string;
    ipAddress: string;
    userAgent?: string;
    location?: string;
    success: boolean;
    details?: string;
}
export declare class SecurityService {
    static logSecurityEvent(data: SecurityLogData): Promise<void>;
    static getIPAddress(req: Request): string;
    static isIPBlacklisted(ipAddress: string): Promise<boolean>;
    static blacklistIP(ipAddress: string, reason: string, userId?: string, expiresInHours?: number): Promise<void>;
    static removeFromBlacklist(ipAddress: string): Promise<void>;
    static handleFailedLogin(userId: string): Promise<boolean>;
    static resetFailedLoginAttempts(userId: string): Promise<void>;
    static isAccountLocked(userId: string): Promise<boolean>;
    static addTrustedIP(userId: string, ipAddress: string): Promise<void>;
    static isIPTrusted(userId: string, ipAddress: string): Promise<boolean>;
    static detectSuspiciousActivity(userId: string): Promise<boolean>;
    static reportSpam(reporterId: string, targetId: string, targetType: 'user' | 'message' | 'chat', reason: string): Promise<void>;
    static getSecurityLogs(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        ipAddress: string;
        action: string;
        userAgent: string | null;
        location: string | null;
        success: boolean;
        details: string | null;
    }[]>;
}
export {};
//# sourceMappingURL=securityService.d.ts.map