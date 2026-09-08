import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const searchMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchByHashtag: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchByMention: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSearchHistory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const clearSearchHistory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteSearchHistoryItem: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=searchController.d.ts.map