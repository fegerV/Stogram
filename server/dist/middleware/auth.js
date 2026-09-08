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
exports.requireAdmin = exports.authenticateToken = exports.auth = exports.authenticateAllowUnverified = exports.authenticate = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const authConfig_1 = require("../utils/authConfig");
const getAdminIdentifiers = () => (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
const resolveAuthenticatedUser = async (req, res, next, options) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jwt.verify(token, (0, authConfig_1.getJwtSecret)());
        if (!decoded.sessionId) {
            return res.status(401).json({ error: 'Invalid session token' });
        }
        const session = await prisma_1.default.userSession.findFirst({
            where: {
                id: decoded.sessionId,
                userId: decoded.userId,
                expiresAt: {
                    gt: new Date(),
                },
            },
            select: { id: true },
        });
        if (!session) {
            return res.status(401).json({ error: 'Session expired or revoked' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
                emailVerified: true,
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (options?.requireVerified !== false && !user.emailVerified) {
            return res.status(403).json({ error: 'Email verification required' });
        }
        req.userId = user.id;
        req.user = user;
        req.sessionId = session.id;
        try {
            await prisma_1.default.userSession.update({
                where: { id: session.id },
                data: { lastActive: new Date() },
            });
        }
        catch {
            // Best-effort touch for session activity
        }
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
const authenticate = async (req, res, next) => resolveAuthenticatedUser(req, res, next, { requireVerified: true });
exports.authenticate = authenticate;
const authenticateAllowUnverified = async (req, res, next) => resolveAuthenticatedUser(req, res, next, { requireVerified: false });
exports.authenticateAllowUnverified = authenticateAllowUnverified;
exports.auth = exports.authenticate;
exports.authenticateToken = exports.authenticate;
const requireAdmin = (req, res, next) => {
    const adminIdentifiers = getAdminIdentifiers();
    if (adminIdentifiers.length === 0) {
        return res.status(403).json({
            error: 'Admin access is not configured. Set ADMIN_USER_IDS to enable admin routes.',
        });
    }
    const matchesAdmin = adminIdentifiers.includes(req.userId || '')
        || adminIdentifiers.includes(req.user?.email || '')
        || adminIdentifiers.includes(req.user?.username || '');
    if (!matchesAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map