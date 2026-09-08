import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const blockUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const unblockUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBlockedUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const isUserBlocked: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=blockController.d.ts.map