import crypto from 'crypto';
import prisma from '../utils/prisma';

export class TwoFactorService {
  // Generate a secret for TOTP
  static generateSecret(): string {
    return crypto.randomBytes(20).toString('base64');
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Hash backup codes before storing
  static hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  // Generate TOTP code
  static generateTOTP(secret: string, window: number = 0): string {
    const epoch = Math.floor(Date.now() / 1000);
    const time = Math.floor(epoch / 30) + window;
    
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(time));
    
    const secretBuffer = Buffer.from(secret, 'base64');
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  // Verify TOTP code with time window
  static verifyTOTP(secret: string, code: string, window: number = 1): boolean {
    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateTOTP(secret, i);
      if (expectedCode === code) {
        return true;
      }
    }
    return false;
  }

  // Enable 2FA for user
  static async enable2FA(userId: string): Promise<{ secret: string; backupCodes: string[] }> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    return { secret, backupCodes };
  }

  // Disable 2FA for user
  static async disable2FA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });
  }

  // Verify 2FA code
  static async verify2FACode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, backupCodes: true },
    });

    if (!user || !user.twoFactorSecret) {
      return false;
    }

    // Try TOTP verification
    if (this.verifyTOTP(user.twoFactorSecret, code)) {
      return true;
    }

    // Try backup code verification
    if (!user.backupCodes) return false;
    
    const hashedCode = this.hashBackupCode(code);
    const backupCodes = JSON.parse(user.backupCodes);
    const backupCodeIndex = backupCodes.indexOf(hashedCode);
    
    if (backupCodeIndex !== -1) {
      // Remove used backup code
      const newBackupCodes = backupCodes.filter((_: string, i: number) => i !== backupCodeIndex);
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: JSON.stringify(newBackupCodes) },
      });
      return true;
    }

    return false;
  }

  // Generate QR code data URL for authenticator apps
  static generateQRCodeData(username: string, secret: string): string {
    const issuer = 'Stogram';
    const otpauthUrl = `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`;
    return otpauthUrl;
  }
}
