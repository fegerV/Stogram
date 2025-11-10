import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  // Get user analytics
  static async getUserAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await AnalyticsService.getUserAnalytics(userId, days);

      res.json({ analytics });
    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(500).json({ error: 'Failed to get user analytics' });
    }
  }

  // Get bot analytics
  static async getBotAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Verify bot ownership
      const prisma = (req as any).prisma;
      const userId = req.userId!;

      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { ownerId: true },
      });

      if (!bot || bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const analytics = await AnalyticsService.getBotAnalytics(botId, days);

      res.json({ analytics });
    } catch (error) {
      console.error('Get bot analytics error:', error);
      res.status(500).json({ error: 'Failed to get bot analytics' });
    }
  }

  // Get system analytics (admin only)
  static async getSystemAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      // TODO: Add admin check
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await AnalyticsService.getSystemAnalytics(days);

      res.json({ analytics });
    } catch (error) {
      console.error('Get system analytics error:', error);
      res.status(500).json({ error: 'Failed to get system analytics' });
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await AnalyticsService.getDashboardStats();

      res.json({ stats });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  }

  // Get bot summary
  static async getBotSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId } = req.params;
      const prisma = (req as any).prisma;
      const userId = req.userId!;

      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: {
          id: true,
          username: true,
          displayName: true,
          messagesSent: true,
          messagesReceived: true,
          uniqueUsers: true,
          isActive: true,
          createdAt: true,
          ownerId: true,
        },
      });

      if (!bot || bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get recent analytics
      const recentAnalytics = await AnalyticsService.getBotAnalytics(botId, 7);

      res.json({
        bot,
        recentAnalytics,
      });
    } catch (error) {
      console.error('Get bot summary error:', error);
      res.status(500).json({ error: 'Failed to get bot summary' });
    }
  }
}
