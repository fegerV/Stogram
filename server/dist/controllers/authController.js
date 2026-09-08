"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAll = exports.logout = exports.refreshAccessToken = exports.resetPassword = exports.forgotPassword = exports.resendVerificationEmailPublic = exports.resendVerificationEmail = exports.verifyEmail = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const emailService_1 = require("../services/emailService");
const auditLogService_1 = require("../services/auditLogService");
const twoFactorService_1 = require("../services/twoFactorService");
const securityService_1 = require("../services/securityService");
const authConfig_1 = require("../utils/authConfig");
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
const createRefreshTokenExpiry = () => {
    const days = (0, authConfig_1.getRefreshTokenTtlDays)();
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
const extractDeviceInfo = (userAgent) => {
    if (!userAgent)
        return 'Unknown Device';
    if (userAgent.includes('Mobile'))
        return 'Mobile Device';
    if (userAgent.includes('Tablet'))
        return 'Tablet';
    if (userAgent.includes('Windows'))
        return 'Windows PC';
    if (userAgent.includes('Mac'))
        return 'Mac';
    if (userAgent.includes('Linux'))
        return 'Linux PC';
    return 'Unknown Device';
};
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().regex(/^[a-zA-Z0-9_]{3,30}$/),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    login: zod_1.z.string(),
    password: zod_1.z.string(),
    code: zod_1.z.string().optional(),
});
const register = async (req, res) => {
    try {
        const { email, username, password, displayName } = registerSchema.parse(req.body);
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
            },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        const verificationToken = (0, emailService_1.generateVerificationToken)();
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = await prisma_1.default.user.create({
            data: {
                email: normalizedEmail,
                username: normalizedUsername,
                password: hashedPassword,
                displayName: displayName || normalizedUsername,
                verificationToken,
                verificationTokenExpiresAt,
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
                emailVerified: true,
                createdAt: true,
            },
        });
        let emailSent = false;
        // Send verification email (don't wait for it)
        if (process.env.SMTP_USER) {
            emailSent = true;
            (0, emailService_1.sendVerificationEmail)(normalizedEmail, verificationToken, normalizedUsername).catch((error) => {
                console.error('Failed to send verification email:', error);
            });
        }
        // Audit log successful registration
        await auditLogService_1.AuditLogService.logAuth(auditLogService_1.AuditAction.USER_REGISTER, user.id, req.ip || req.socket.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown', true);
        res.status(201).json({
            user,
            requiresEmailVerification: true,
            emailSent,
            message: emailSent
                ? 'Registration successful. Please verify your email before signing in.'
                : 'Registration successful, but email delivery is not configured on the server.',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { login, password, code } = loginSchema.parse(req.body);
        const normalizedLogin = login.trim();
        const normalizedEmailLogin = normalizedLogin.toLowerCase();
        const user = await prisma_1.default.user.findFirst({
            where: {
                OR: [{ email: normalizedEmailLogin }, { username: normalizedLogin }],
            },
        });
        if (!user) {
            // Audit log failed login attempt
            await auditLogService_1.AuditLogService.logAuth(auditLogService_1.AuditAction.USER_LOGIN, 'unknown', req.ip || req.socket.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown', false, 'User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(423).json({
                error: 'Account is temporarily locked due to multiple failed login attempts',
                code: 'ACCOUNT_LOCKED',
                lockedUntil: user.lockedUntil,
            });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            const isNowLocked = await securityService_1.SecurityService.handleFailedLogin(user.id);
            // Audit log failed login attempt
            await auditLogService_1.AuditLogService.logAuth(auditLogService_1.AuditAction.USER_LOGIN, user.id, req.ip || req.socket.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown', false, 'Invalid password');
            if (isNowLocked) {
                return res.status(423).json({
                    error: 'Account is temporarily locked due to multiple failed login attempts',
                    code: 'ACCOUNT_LOCKED',
                });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        await securityService_1.SecurityService.resetFailedLoginAttempts(user.id);
        if (user.twoFactorEnabled) {
            if (!code) {
                return res.status(401).json({
                    error: 'Two-factor authentication code is required',
                    code: 'TWO_FACTOR_REQUIRED',
                });
            }
            const isValidCode = await twoFactorService_1.TwoFactorService.verify2FACode(user.id, code);
            if (!isValidCode) {
                return res.status(401).json({
                    error: 'Invalid two-factor authentication code',
                    code: 'TWO_FACTOR_INVALID',
                });
            }
        }
        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Please verify your email before signing in',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { status: 'ONLINE', lastSeen: new Date() },
        });
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);
        const session = await prisma_1.default.userSession.create({
            data: {
                userId: user.id,
                refreshTokenHash,
                device: extractDeviceInfo(req.headers['user-agent']),
                ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || null,
                expiresAt: createRefreshTokenExpiry(),
            },
        });
        const accessTokenTtl = (0, authConfig_1.getAccessTokenTtl)();
        const token = jwt.sign({ userId: user.id, sessionId: session.id }, (0, authConfig_1.getJwtSecret)(), { expiresIn: accessTokenTtl });
        const userResponse = {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            bio: user.bio,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
        };
        // Audit log successful login
        await auditLogService_1.AuditLogService.logAuth(auditLogService_1.AuditAction.USER_LOGIN, user.id, req.ip || req.socket.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown', true);
        res.json({ user: userResponse, token, refreshToken });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
                lastSeen: true,
                emailVerified: true,
                theme: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getMe = getMe;
const verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string(),
});
const verifyEmail = async (req, res) => {
    try {
        const { token } = verifyEmailSchema.parse(req.body);
        const user = await prisma_1.default.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });
        // Audit log email verification
        await auditLogService_1.AuditLogService.logAuth(auditLogService_1.AuditAction.EMAIL_VERIFIED, user.id, req.ip || req.socket.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown', true);
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Email verification failed' });
    }
};
exports.verifyEmail = verifyEmail;
const resendVerificationEmail = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        const verificationToken = (0, emailService_1.generateVerificationToken)();
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { verificationToken, verificationTokenExpiresAt },
        });
        if (process.env.SMTP_USER) {
            await (0, emailService_1.sendVerificationEmail)(user.email, verificationToken, user.username);
        }
        res.json({ message: 'Verification email sent' });
    }
    catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
const publicResendVerificationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8),
});
const resendVerificationEmailPublic = async (req, res) => {
    try {
        const { email } = publicResendVerificationSchema.parse(req.body);
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (user && !user.emailVerified) {
            const verificationToken = (0, emailService_1.generateVerificationToken)();
            const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { verificationToken, verificationTokenExpiresAt },
            });
            if (process.env.SMTP_USER) {
                await (0, emailService_1.sendVerificationEmail)(user.email, verificationToken, user.username);
            }
        }
        res.json({
            message: 'If an unverified account exists for this email, a new verification link has been sent.',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Public resend verification email error:', error);
        res.status(500).json({ error: 'Failed to process verification email request' });
    }
};
exports.resendVerificationEmailPublic = resendVerificationEmailPublic;
const forgotPassword = async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({
                message: 'If an account exists for this email, a password reset link has been sent.',
            });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiresAt,
            },
        });
        if (process.env.SMTP_USER) {
            await (0, emailService_1.sendPasswordResetEmail)(user.email, resetToken, user.username);
        }
        res.json({
            message: 'If an account exists for this email, a password reset link has been sent.',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = resetPasswordSchema.parse(req.body);
        const user = await prisma_1.default.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiresAt: null,
            },
        });
        // Audit log password reset
        await auditLogService_1.AuditLogService.logAuth(auditLogService_1.AuditAction.USER_LOGIN, // Reuse login action for password reset
        user.id, req.ip || req.socket.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown', true);
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
exports.resetPassword = resetPassword;
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = refreshTokenSchema.parse(req.body);
        const refreshTokenHash = hashToken(refreshToken);
        const session = await prisma_1.default.userSession.findFirst({
            where: {
                refreshTokenHash,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: { user: true },
        });
        if (!session) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        if (!session.user.emailVerified) {
            return res.status(403).json({
                error: 'Please verify your email before signing in',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }
        const newRefreshToken = generateRefreshToken();
        const newRefreshTokenHash = hashToken(newRefreshToken);
        await prisma_1.default.userSession.update({
            where: { id: session.id },
            data: {
                refreshTokenHash: newRefreshTokenHash,
                lastActive: new Date(),
                expiresAt: createRefreshTokenExpiry(),
            },
        });
        const accessTokenTtl = (0, authConfig_1.getAccessTokenTtl)();
        const token = jwt.sign({ userId: session.userId, sessionId: session.id }, (0, authConfig_1.getJwtSecret)(), { expiresIn: accessTokenTtl });
        res.json({ token, refreshToken: newRefreshToken });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
};
exports.refreshAccessToken = refreshAccessToken;
const logout = async (req, res) => {
    try {
        if (req.sessionId) {
            await prisma_1.default.userSession.deleteMany({
                where: {
                    id: req.sessionId,
                    userId: req.userId,
                },
            });
        }
        else {
            const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
            if (refreshToken) {
                const refreshTokenHash = hashToken(refreshToken);
                await prisma_1.default.userSession.deleteMany({
                    where: {
                        userId: req.userId,
                        refreshTokenHash,
                    },
                });
            }
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
exports.logout = logout;
const logoutAll = async (req, res) => {
    try {
        await prisma_1.default.userSession.deleteMany({
            where: { userId: req.userId },
        });
        res.json({ message: 'Logged out from all devices' });
    }
    catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
exports.logoutAll = logoutAll;
//# sourceMappingURL=authController.js.map