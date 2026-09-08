export declare class TwoFactorService {
    static generateSecret(): string;
    static generateBackupCodes(count?: number): string[];
    static hashBackupCode(code: string): string;
    static generateTOTP(secret: string, window?: number): string;
    static verifyTOTP(secret: string, code: string, window?: number): boolean;
    static enable2FA(userId: string): Promise<{
        secret: string;
        backupCodes: string[];
    }>;
    static disable2FA(userId: string): Promise<void>;
    static verify2FACode(userId: string, code: string): Promise<boolean>;
    static generateQRCodeData(username: string, secret: string): string;
}
//# sourceMappingURL=twoFactorService.d.ts.map