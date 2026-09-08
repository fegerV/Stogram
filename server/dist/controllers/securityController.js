"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const twoFactorService_1 = require("../services/twoFactorService");
const securityService_1 = require("../services/securityService");
const encryptionService_1 = require("../services/encryptionService");
const prisma_1 = __importDefault(require("../utils/prisma"));
class SecurityController {
    // Enable 2FA
    static async enable2FA(req, res) {
        try {
            const userId = req.userId;
            const { password } = req.body;
            // Verify password here (implementation depends on your auth system)
            const { secret, backupCodes } = await twoFactorService_1.TwoFactorService.enable2FA(userId);
            const user = req.user;
            const qrCodeData = twoFactorService_1.TwoFactorService.generateQRCodeData(user.username, secret);
            res.json({
                success: true,
                data: {
                    secret,
                    qrCodeData,
                    backupCodes,
                },
            });
        }
        catch (error) {
            console.error('Enable 2FA error:', error);
            res.status(500).json({ error: 'Failed to enable 2FA' });
        }
    }
    // Verify and confirm 2FA setup
    static async verify2FASetup(req, res) {
        try {
            const userId = req.userId;
            const { code } = req.body;
            const isValid = await twoFactorService_1.TwoFactorService.verify2FACode(userId, code);
            if (!isValid) {
                res.status(400).json({ error: 'Invalid 2FA code' });
                return;
            }
            res.json({ success: true, message: '2FA enabled successfully' });
        }
        catch (error) {
            console.error('Verify 2FA setup error:', error);
            res.status(500).json({ error: 'Failed to verify 2FA setup' });
        }
    }
    // Disable 2FA
    static async disable2FA(req, res) {
        try {
            const userId = req.userId;
            const { code } = req.body;
            const isValid = await twoFactorService_1.TwoFactorService.verify2FACode(userId, code);
            if (!isValid) {
                res.status(400).json({ error: 'Invalid 2FA code' });
                return;
            }
            await twoFactorService_1.TwoFactorService.disable2FA(userId);
            res.json({ success: true, message: '2FA disabled successfully' });
        }
        catch (error) {
            console.error('Disable 2FA error:', error);
            res.status(500).json({ error: 'Failed to disable 2FA' });
        }
    }
    // Initialize E2E encryption for user
    static async initializeEncryption(req, res) {
        try {
            const userId = req.userId;
            const { password } = req.body;
            await encryptionService_1.EncryptionService.initializeUserEncryption(userId, password);
            res.json({ success: true, message: 'E2E encryption initialized' });
        }
        catch (error) {
            console.error('Initialize encryption error:', error);
            res.status(500).json({ error: 'Failed to initialize encryption' });
        }
    }
    // Get user's public key
    static async getPublicKey(req, res) {
        try {
            const { userId } = req.params;
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { publicKey: true },
            });
            if (!user || !user.publicKey) {
                res.status(404).json({ error: 'Public key not found' });
                return;
            }
            res.json({ publicKey: user.publicKey });
        }
        catch (error) {
            console.error('Get public key error:', error);
            res.status(500).json({ error: 'Failed to get public key' });
        }
    }
    // Get security logs
    static async getSecurityLogs(req, res) {
        try {
            const userId = req.userId;
            const limit = parseInt(req.query.limit) || 50;
            const logs = await securityService_1.SecurityService.getSecurityLogs(userId, limit);
            res.json({ logs });
        }
        catch (error) {
            console.error('Get security logs error:', error);
            res.status(500).json({ error: 'Failed to get security logs' });
        }
    }
    // Add trusted IP
    static async addTrustedIP(req, res) {
        try {
            const userId = req.userId;
            const { ipAddress } = req.body;
            await securityService_1.SecurityService.addTrustedIP(userId, ipAddress);
            res.json({ success: true, message: 'IP added to trusted list' });
        }
        catch (error) {
            console.error('Add trusted IP error:', error);
            res.status(500).json({ error: 'Failed to add trusted IP' });
        }
    }
    // Report spam
    static async reportSpam(req, res) {
        try {
            const userId = req.userId;
            const { targetId, targetType, reason } = req.body;
            await securityService_1.SecurityService.reportSpam(userId, targetId, targetType, reason);
            res.json({ success: true, message: 'Spam report submitted' });
        }
        catch (error) {
            console.error('Report spam error:', error);
            res.status(500).json({ error: 'Failed to report spam' });
        }
    }
    // Check account status
    static async checkAccountStatus(req, res) {
        try {
            const userId = req.userId;
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    twoFactorEnabled: true,
                    publicKey: true,
                    failedLoginAttempts: true,
                    lockedUntil: true,
                    trustedIPs: true,
                },
            });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const isLocked = user.lockedUntil && user.lockedUntil > new Date();
            res.json({
                twoFactorEnabled: user.twoFactorEnabled,
                encryptionEnabled: !!user.publicKey,
                isLocked,
                lockedUntil: user.lockedUntil,
                failedLoginAttempts: user.failedLoginAttempts,
                trustedIPsCount: user.trustedIPs ? JSON.parse(user.trustedIPs).length : 0,
            });
        }
        catch (error) {
            console.error('Check account status error:', error);
            res.status(500).json({ error: 'Failed to check account status' });
        }
    }
}
exports.SecurityController = SecurityController;
//# sourceMappingURL=securityController.js.map