import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class AnalyticsController {
    static getUserAnalytics(req: AuthRequest, res: Response): Promise<void>;
    static getBotAnalytics(req: AuthRequest, res: Response): Promise<void>;
    static getSystemAnalytics(req: AuthRequest, res: Response): Promise<void>;
    static getDashboardStats(req: AuthRequest, res: Response): Promise<void>;
    static getBotSummary(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=analyticsController.d.ts.map