"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAllSessions = exports.revokeSession = exports.getSessions = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getSessions = async (req, res) => {
    try {
        const sessions = await prisma_1.default.userSession.findMany({
            where: { userId: req.userId },
            orderBy: { lastActive: 'desc' },
            select: {
                id: true,
                device: true,
                ipAddress: true,
                userAgent: true,
                lastActive: true,
                createdAt: true,
            },
        });
        const currentSessionId = req.sessionId || null;
        const sessionsWithCurrent = sessions.map((session) => ({
            ...session,
            isCurrent: session.id === currentSessionId,
        }));
        res.json({ sessions: sessionsWithCurrent });
    }
    catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};
exports.getSessions = getSessions;
const revokeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma_1.default.userSession.findFirst({
            where: {
                id,
                userId: req.userId,
            },
        });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        await prisma_1.default.userSession.delete({
            where: { id },
        });
        res.json({ message: 'Session revoked successfully' });
    }
    catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
};
exports.revokeSession = revokeSession;
const revokeAllSessions = async (req, res) => {
    try {
        await prisma_1.default.userSession.deleteMany({
            where: {
                userId: req.userId,
                ...(req.sessionId ? { NOT: { id: req.sessionId } } : {}),
            },
        });
        res.json({ message: 'All other sessions revoked successfully' });
    }
    catch (error) {
        console.error('Revoke all sessions error:', error);
        res.status(500).json({ error: 'Failed to revoke sessions' });
    }
};
exports.revokeAllSessions = revokeAllSessions;
//# sourceMappingURL=sessionController.js.map