import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getFolders: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createFolder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateFolder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteFolder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addChatToFolder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeChatFromFolder: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=folderController.d.ts.map