"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = exports.AuditAction = void 0;
const winston_1 = __importDefault(require("winston"));
// Configure Winston logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/audit.log', level: 'info' }),
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});
// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
var AuditAction;
(function (AuditAction) {
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_REGISTER"] = "USER_REGISTER";
    AuditAction["USER_DELETE"] = "USER_DELETE";
    AuditAction["USER_UPDATE"] = "USER_UPDATE";
    AuditAction["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditAction["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    AuditAction["CHAT_CREATE"] = "CHAT_CREATE";
    AuditAction["CHAT_DELETE"] = "CHAT_DELETE";
    AuditAction["CHAT_JOIN"] = "CHAT_JOIN";
    AuditAction["CHAT_LEAVE"] = "CHAT_LEAVE";
    AuditAction["MESSAGE_SEND"] = "MESSAGE_SEND";
    AuditAction["MESSAGE_DELETE"] = "MESSAGE_DELETE";
    AuditAction["MESSAGE_EDIT"] = "MESSAGE_EDIT";
    AuditAction["FILE_UPLOAD"] = "FILE_UPLOAD";
    AuditAction["FILE_DELETE"] = "FILE_DELETE";
    AuditAction["BOT_CREATE"] = "BOT_CREATE";
    AuditAction["BOT_DELETE"] = "BOT_DELETE";
    AuditAction["BOT_UPDATE"] = "BOT_UPDATE";
    AuditAction["WEBHOOK_CREATE"] = "WEBHOOK_CREATE";
    AuditAction["WEBHOOK_DELETE"] = "WEBHOOK_DELETE";
    AuditAction["WEBHOOK_TRIGGER"] = "WEBHOOK_TRIGGER";
    AuditAction["ADMIN_ACTION"] = "ADMIN_ACTION";
    AuditAction["SECURITY_EVENT"] = "SECURITY_EVENT";
    AuditAction["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
class AuditLogService {
    /**
     * Log an audit event
     */
    static async log(entry) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...entry,
        };
        // Log to Winston
        if (entry.success) {
            logger.info('Audit Log', logEntry);
        }
        else {
            logger.warn('Audit Log - Failed', logEntry);
        }
        // Store in database if Prisma schema supports it
        // For now, we'll just use file-based logging
        try {
            // In a production app, you'd store this in a dedicated audit_logs table
            // await prisma.auditLog.create({ data: logEntry });
        }
        catch (error) {
            logger.error('Failed to store audit log in database', { error, entry });
        }
    }
    /**
     * Log user authentication events
     */
    static async logAuth(action, userId, ip, userAgent, success, errorMessage) {
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
    static async logCriticalOperation(action, userId, resource, resourceId, ip, details) {
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
    static async logSecurityEvent(description, ip, userId, details) {
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
    static async logRateLimitExceeded(ip, path, userId) {
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
exports.AuditLogService = AuditLogService;
exports.default = AuditLogService;
//# sourceMappingURL=auditLogService.js.map