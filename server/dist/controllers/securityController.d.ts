import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class SecurityController {
    static enable2FA(req: AuthRequest, res: Response): Promise<void>;
    static verify2FASetup(req: AuthRequest, res: Response): Promise<void>;
    static disable2FA(req: AuthRequest, res: Response): Promise<void>;
    static initializeEncryption(req: AuthRequest, res: Response): Promise<void>;
    static getPublicKey(req: AuthRequest, res: Response): Promise<void>;
    static getSecurityLogs(req: AuthRequest, res: Response): Promise<void>;
    static addTrustedIP(req: AuthRequest, res: Response): Promise<void>;
    static reportSpam(req: AuthRequest, res: Response): Promise<void>;
    static checkAccountStatus(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=securityController.d.ts.map