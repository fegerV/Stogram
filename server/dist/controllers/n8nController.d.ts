import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
export declare const getEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getChatsForN8n: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendMessageFromN8n: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getChatMessagesForN8n: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createChatFromN8n: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserInfoForN8n: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=n8nController.d.ts.map