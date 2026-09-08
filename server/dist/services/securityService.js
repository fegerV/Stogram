"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class SecurityService {
    // Log security event
    static async logSecurityEvent(data) {
        await prisma_1.default.securityLog.create({
            data,
        });
    }
    // Get IP address from request
    static getIPAddress(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket.remoteAddress ||
            'unknown');
    }
    // Check if IP is blacklisted
    static async isIPBlacklisted(ipAddress) {
        const blacklist = await prisma_1.default.iPBlacklist.findFirst({
            where: {
                ipAddress,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });
        return !!blacklist;
    }
    // Blacklist IP address
    static async blacklistIP(ipAddress, reason, userId, expiresInHours) {
        const expiresAt = expiresInHours
            ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
            : undefined;
        await prisma_1.default.iPBlacklist.create({
            data: {
                ipAddress,
                reason,
                userId,
                expiresAt,
            },
        });
    }
    // Remove IP from blacklist
    static async removeFromBlacklist(ipAddress) {
        await prisma_1.default.iPBlacklist.deleteMany({
            where: { ipAddress },
        });
    }
    // Handle failed login attempt
    static async handleFailedLogin(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { failedLoginAttempts: true, lockedUntil: true },
        });
        if (!user)
            return false;
        // Check if already locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return true; // Account is locked
        }
        const newAttempts = user.failedLoginAttempts + 1;
        const maxAttempts = 5;
        const lockDurationMinutes = 30;
        if (newAttempts >= maxAttempts) {
            // Lock account
            await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    failedLoginAttempts: newAttempts,
                    lockedUntil: new Date(Date.now() + lockDurationMinutes * 60 * 1000),
                },
            });
            return true;
        }
        // Increment failed attempts
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { failedLoginAttempts: newAttempts },
        });
        return false;
    }
    // Reset failed login attempts on successful login
    static async resetFailedLoginAttempts(userId) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
    }
    // Check if user account is locked
    static async isAccountLocked(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { lockedUntil: true },
        });
        if (!user || !user.lockedUntil)
            return false;
        return user.lockedUntil > new Date();
    }
    // Add trusted IP for user
    static async addTrustedIP(userId, ipAddress) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { trustedIPs: true },
        });
        if (!user)
            return;
        const currentIPs = user.trustedIPs ? JSON.parse(user.trustedIPs) : [];
        const trustedIPs = [...currentIPs, ipAddress];
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { trustedIPs: JSON.stringify(trustedIPs) },
        });
    }
    // Check if IP is trusted
    static async isIPTrusted(userId, ipAddress) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { trustedIPs: true },
        });
        if (!user || !user.trustedIPs)
            return false;
        const trustedIPs = JSON.parse(user.trustedIPs);
        return trustedIPs.includes(ipAddress);
    }
    // Detect suspicious activity
    static async detectSuspiciousActivity(userId) {
        const recentLogs = await prisma_1.default.securityLog.findMany({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        // Check for multiple failed logins
        const failedLogins = recentLogs.filter((log) => log.action === 'login' && !log.success);
        if (failedLogins.length > 3)
            return true;
        // Check for multiple IPs
        const uniqueIPs = new Set(recentLogs.map((log) => log.ipAddress));
        if (uniqueIPs.size > 5)
            return true;
        // Check for rapid actions
        if (recentLogs.length > 30)
            return true;
        return false;
    }
    // Report spam
    static async reportSpam(reporterId, targetId, targetType, reason) {
        await prisma_1.default.spamReport.create({
            data: {
                reporterId,
                targetId,
                targetType,
                reason,
            },
        });
        // Auto-action if multiple reports
        const reportCount = await prisma_1.default.spamReport.count({
            where: {
                targetId,
                targetType,
                status: 'pending',
            },
        });
        if (reportCount >= 3) {
            // Auto-blacklist or take action
            if (targetType === 'user') {
                // Could implement auto-ban logic here
            }
        }
    }
    // Get security logs for user
    static async getSecurityLogs(userId, limit = 50) {
        return await prisma_1.default.securityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
exports.SecurityService = SecurityService;
//# sourceMappingURL=securityService.js.map