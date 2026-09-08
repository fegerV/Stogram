import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getStorageInfo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const clearCache: (req: AuthRequest, res: Response) => Promise<void>;
export declare const exportData: (req: AuthRequest, res: Response) => Promise<void>;
export declare const importData: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=accountController.d.ts.map