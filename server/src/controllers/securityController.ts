import { Request, Response } from 'express';
import { TwoFactorService } from '../services/twoFactorService';
import { SecurityService } from '../services/securityService';
import { EncryptionService } from '../services/encryptionService';

export class SecurityController {
  // Enable 2FA
  static async enable2FA(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;

      // Verify password here (implementation depends on your auth system)
      
      const { secret, backupCodes } = await TwoFactorService.enable2FA(userId);
      const user = (req as any).user;
      const qrCodeData = TwoFactorService.generateQRCodeData(user.username, secret);

      res.json({
        success: true,
        data: {
          secret,
          qrCodeData,
          backupCodes,
        },
      });
    } catch (error) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({ error: 'Failed to enable 2FA' });
    }
  }

  // Verify and confirm 2FA setup
  static async verify2FASetup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { code } = req.body;

      const isValid = await TwoFactorService.verify2FACode(userId, code);

      if (!isValid) {
        res.status(400).json({ error: 'Invalid 2FA code' });
        return;
      }

      res.json({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
      console.error('Verify 2FA setup error:', error);
      res.status(500).json({ error: 'Failed to verify 2FA setup' });
    }
  }

  // Disable 2FA
  static async disable2FA(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { code } = req.body;

      const isValid = await TwoFactorService.verify2FACode(userId, code);

      if (!isValid) {
        res.status(400).json({ error: 'Invalid 2FA code' });
        return;
      }

      await TwoFactorService.disable2FA(userId);

      res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({ error: 'Failed to disable 2FA' });
    }
  }

  // Initialize E2E encryption for user
  static async initializeEncryption(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;

      await EncryptionService.initializeUserEncryption(userId, password);

      res.json({ success: true, message: 'E2E encryption initialized' });
    } catch (error) {
      console.error('Initialize encryption error:', error);
      res.status(500).json({ error: 'Failed to initialize encryption' });
    }
  }

  // Get user's public key
  static async getPublicKey(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const prisma = (req as any).prisma;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { publicKey: true },
      });

      if (!user || !user.publicKey) {
        res.status(404).json({ error: 'Public key not found' });
        return;
      }

      res.json({ publicKey: user.publicKey });
    } catch (error) {
      console.error('Get public key error:', error);
      res.status(500).json({ error: 'Failed to get public key' });
    }
  }

  // Get security logs
  static async getSecurityLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await SecurityService.getSecurityLogs(userId, limit);

      res.json({ logs });
    } catch (error) {
      console.error('Get security logs error:', error);
      res.status(500).json({ error: 'Failed to get security logs' });
    }
  }

  // Add trusted IP
  static async addTrustedIP(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { ipAddress } = req.body;

      await SecurityService.addTrustedIP(userId, ipAddress);

      res.json({ success: true, message: 'IP added to trusted list' });
    } catch (error) {
      console.error('Add trusted IP error:', error);
      res.status(500).json({ error: 'Failed to add trusted IP' });
    }
  }

  // Report spam
  static async reportSpam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { targetId, targetType, reason } = req.body;

      await SecurityService.reportSpam(userId, targetId, targetType, reason);

      res.json({ success: true, message: 'Spam report submitted' });
    } catch (error) {
      console.error('Report spam error:', error);
      res.status(500).json({ error: 'Failed to report spam' });
    }
  }

  // Check account status
  static async checkAccountStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const prisma = (req as any).prisma;

      const user = await prisma.user.findUnique({
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
        trustedIPsCount: user.trustedIPs.length,
      });
    } catch (error) {
      console.error('Check account status error:', error);
      res.status(500).json({ error: 'Failed to check account status' });
    }
  }
}
