import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const pinMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const unpinMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPinnedMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllPinnedMessages: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=pinnedMessageController.d.ts.map