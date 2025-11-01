import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

interface SecurityLogData {
  userId: string;
  action: string;
  ipAddress: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  details?: string;
}

export class SecurityService {
  // Log security event
  static async logSecurityEvent(data: SecurityLogData): Promise<void> {
    await prisma.securityLog.create({
      data,
    });
  }

  // Get IP address from request
  static getIPAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  // Check if IP is blacklisted
  static async isIPBlacklisted(ipAddress: string): Promise<boolean> {
    const blacklist = await prisma.iPBlacklist.findFirst({
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
  static async blacklistIP(
    ipAddress: string,
    reason: string,
    userId?: string,
    expiresInHours?: number
  ): Promise<void> {
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : undefined;

    await prisma.iPBlacklist.create({
      data: {
        ipAddress,
        reason,
        userId,
        expiresAt,
      },
    });
  }

  // Remove IP from blacklist
  static async removeFromBlacklist(ipAddress: string): Promise<void> {
    await prisma.iPBlacklist.deleteMany({
      where: { ipAddress },
    });
  }

  // Handle failed login attempt
  static async handleFailedLogin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user) return false;

    // Check if already locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return true; // Account is locked
    }

    const newAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = 5;
    const lockDurationMinutes = 30;

    if (newAttempts >= maxAttempts) {
      // Lock account
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: new Date(Date.now() + lockDurationMinutes * 60 * 1000),
        },
      });
      return true;
    }

    // Increment failed attempts
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: newAttempts },
    });

    return false;
  }

  // Reset failed login attempts on successful login
  static async resetFailedLoginAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  // Check if user account is locked
  static async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (!user || !user.lockedUntil) return false;

    return user.lockedUntil > new Date();
  }

  // Add trusted IP for user
  static async addTrustedIP(userId: string, ipAddress: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustedIPs: true },
    });

    if (!user) return;

    const trustedIPs = [...user.trustedIPs, ipAddress];
    
    await prisma.user.update({
      where: { id: userId },
      data: { trustedIPs },
    });
  }

  // Check if IP is trusted
  static async isIPTrusted(userId: string, ipAddress: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustedIPs: true },
    });

    return user?.trustedIPs.includes(ipAddress) || false;
  }

  // Detect suspicious activity
  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
    const recentLogs = await prisma.securityLog.findMany({
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
    const failedLogins = recentLogs.filter(
      log => log.action === 'login' && !log.success
    );
    if (failedLogins.length > 3) return true;

    // Check for multiple IPs
    const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress));
    if (uniqueIPs.size > 5) return true;

    // Check for rapid actions
    if (recentLogs.length > 30) return true;

    return false;
  }

  // Report spam
  static async reportSpam(
    reporterId: string,
    targetId: string,
    targetType: 'user' | 'message' | 'chat',
    reason: string
  ): Promise<void> {
    await prisma.spamReport.create({
      data: {
        reporterId,
        targetId,
        targetType,
        reason,
      },
    });

    // Auto-action if multiple reports
    const reportCount = await prisma.spamReport.count({
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
  static async getSecurityLogs(userId: string, limit: number = 50) {
    return await prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
