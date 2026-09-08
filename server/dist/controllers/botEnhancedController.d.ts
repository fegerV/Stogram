import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class BotEnhancedController {
    static createInlineKeyboard(req: AuthRequest, res: Response): Promise<void>;
    static getInlineKeyboards(req: AuthRequest, res: Response): Promise<void>;
    static deleteInlineKeyboard(req: AuthRequest, res: Response): Promise<void>;
    static handleCallbackQuery(req: AuthRequest, res: Response): Promise<void>;
    static answerCallbackQuery(req: AuthRequest, res: Response): Promise<void>;
    static handleInlineQuery(req: AuthRequest, res: Response): Promise<void>;
    static answerInlineQuery(req: AuthRequest, res: Response): Promise<void>;
    static sendMessageWithKeyboard(req: AuthRequest, res: Response): Promise<void>;
    static getCallbackQueries(req: AuthRequest, res: Response): Promise<void>;
    static getInlineQueries(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=botEnhancedController.d.ts.map