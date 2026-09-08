export declare enum AuditAction {
    USER_LOGIN = "USER_LOGIN",
    USER_LOGOUT = "USER_LOGOUT",
    USER_REGISTER = "USER_REGISTER",
    USER_DELETE = "USER_DELETE",
    USER_UPDATE = "USER_UPDATE",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    EMAIL_VERIFIED = "EMAIL_VERIFIED",
    CHAT_CREATE = "CHAT_CREATE",
    CHAT_DELETE = "CHAT_DELETE",
    CHAT_JOIN = "CHAT_JOIN",
    CHAT_LEAVE = "CHAT_LEAVE",
    MESSAGE_SEND = "MESSAGE_SEND",
    MESSAGE_DELETE = "MESSAGE_DELETE",
    MESSAGE_EDIT = "MESSAGE_EDIT",
    FILE_UPLOAD = "FILE_UPLOAD",
    FILE_DELETE = "FILE_DELETE",
    BOT_CREATE = "BOT_CREATE",
    BOT_DELETE = "BOT_DELETE",
    BOT_UPDATE = "BOT_UPDATE",
    WEBHOOK_CREATE = "WEBHOOK_CREATE",
    WEBHOOK_DELETE = "WEBHOOK_DELETE",
    WEBHOOK_TRIGGER = "WEBHOOK_TRIGGER",
    ADMIN_ACTION = "ADMIN_ACTION",
    SECURITY_EVENT = "SECURITY_EVENT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
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
export declare class AuditLogService {
    /**
     * Log an audit event
     */
    static log(entry: AuditLogEntry): Promise<void>;
    /**
     * Log user authentication events
     */
    static logAuth(action: AuditAction.USER_LOGIN | AuditAction.USER_LOGOUT | AuditAction.USER_REGISTER | AuditAction.EMAIL_VERIFIED, userId: string, ip: string, userAgent: string, success: boolean, errorMessage?: string): Promise<void>;
    /**
     * Log critical operations
     */
    static logCriticalOperation(action: AuditAction, userId: string, resource: string, resourceId: string, ip: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log security events
     */
    static logSecurityEvent(description: string, ip: string, userId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log rate limit exceeded events
     */
    static logRateLimitExceeded(ip: string, path: string, userId?: string): Promise<void>;
}
export default AuditLogService;
//# sourceMappingURL=auditLogService.d.ts.map