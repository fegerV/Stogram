import { prisma } from '../index';
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log', level: 'info' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_DELETE = 'USER_DELETE',
  USER_UPDATE = 'USER_UPDATE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  
  CHAT_CREATE = 'CHAT_CREATE',
  CHAT_DELETE = 'CHAT_DELETE',
  CHAT_JOIN = 'CHAT_JOIN',
  CHAT_LEAVE = 'CHAT_LEAVE',
  
  MESSAGE_SEND = 'MESSAGE_SEND',
  MESSAGE_DELETE = 'MESSAGE_DELETE',
  MESSAGE_EDIT = 'MESSAGE_EDIT',
  
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE = 'FILE_DELETE',
  
  BOT_CREATE = 'BOT_CREATE',
  BOT_DELETE = 'BOT_DELETE',
  BOT_UPDATE = 'BOT_UPDATE',
  
  WEBHOOK_CREATE = 'WEBHOOK_CREATE',
  WEBHOOK_DELETE = 'WEBHOOK_DELETE',
  WEBHOOK_TRIGGER = 'WEBHOOK_TRIGGER',
  
  ADMIN_ACTION = 'ADMIN_ACTION',
  SECURITY_EVENT = 'SECURITY_EVENT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogService {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Log to Winston
    if (entry.success) {
      logger.info('Audit Log', logEntry);
    } else {
      logger.warn('Audit Log - Failed', logEntry);
    }

    // Store in database if Prisma schema supports it
    // For now, we'll just use file-based logging
    try {
      // In a production app, you'd store this in a dedicated audit_logs table
      // await prisma.auditLog.create({ data: logEntry });
    } catch (error) {
      logger.error('Failed to store audit log in database', { error, entry });
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(
    action: AuditAction.USER_LOGIN | AuditAction.USER_LOGOUT | AuditAction.USER_REGISTER | AuditAction.EMAIL_VERIFIED,
    userId: string,
    ip: string,
    userAgent: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      userId,
      ip,
      userAgent,
      success,
      errorMessage,
    });
  }

  /**
   * Log critical operations
   */
  static async logCriticalOperation(
    action: AuditAction,
    userId: string,
    resource: string,
    resourceId: string,
    ip: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      userId,
      ip,
      resource,
      resourceId,
      details,
      success: true,
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    description: string,
    ip: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: AuditAction.SECURITY_EVENT,
      userId,
      ip,
      details: {
        description,
        ...details,
      },
      success: true,
    });
  }

  /**
   * Log rate limit exceeded events
   */
  static async logRateLimitExceeded(
    ip: string,
    path: string,
    userId?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      userId,
      ip,
      resource: path,
      success: false,
      errorMessage: 'Rate limit exceeded',
    });
  }
}

export default AuditLogService;
