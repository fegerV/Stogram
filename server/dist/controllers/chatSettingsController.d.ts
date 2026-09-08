import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getChatSettings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateChatSettings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const muteChat: (req: AuthRequest, res: Response) => Promise<void>;
export declare const unmuteChat: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateNotificationLevel: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const toggleFavorite: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUnreadCount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const resetUnreadCount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const archiveChat: (req: AuthRequest, res: Response) => Promise<void>;
export declare const unarchiveChat: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getArchivedChats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=chatSettingsController.d.ts.map