import { Request, Response } from 'express';
export declare const getBotConfig: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const saveBotConfig: (req: Request, res: Response) => Promise<void>;
export declare const botWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBotStats: (req: Request, res: Response) => Promise<void>;
export declare const sendBotMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBotUsers: (req: Request, res: Response) => Promise<void>;
export declare const authorizeUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const broadcastMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const setBotCommands: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const testBotConnection: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=telegramBotController.d.ts.map