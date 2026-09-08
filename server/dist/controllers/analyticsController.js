"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
const prisma_1 = __importDefault(require("../utils/prisma"));
class AnalyticsController {
    // Get user analytics
    static async getUserAnalytics(req, res) {
        try {
            const userId = req.userId;
            const days = parseInt(req.query.days) || 30;
            const analytics = await analyticsService_1.AnalyticsService.getUserAnalytics(userId, days);
            res.json({ analytics });
        }
        catch (error) {
            console.error('Get user analytics error:', error);
            res.status(500).json({ error: 'Failed to get user analytics' });
        }
    }
    // Get bot analytics
    static async getBotAnalytics(req, res) {
        try {
            const { botId } = req.params;
            const days = parseInt(req.query.days) || 30;
            // Verify bot ownership
            const userId = req.userId;
            const bot = await prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: { ownerId: true },
            });
            if (!bot || bot.ownerId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const analytics = await analyticsService_1.AnalyticsService.getBotAnalytics(botId, days);
            res.json({ analytics });
        }
        catch (error) {
            console.error('Get bot analytics error:', error);
            res.status(500).json({ error: 'Failed to get bot analytics' });
        }
    }
    // Get system analytics (admin only)
    static async getSystemAnalytics(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const analytics = await analyticsService_1.AnalyticsService.getSystemAnalytics(days);
            res.json({ analytics });
        }
        catch (error) {
            console.error('Get system analytics error:', error);
            res.status(500).json({ error: 'Failed to get system analytics' });
        }
    }
    // Get dashboard statistics
    static async getDashboardStats(req, res) {
        try {
            const stats = await analyticsService_1.AnalyticsService.getDashboardStats();
            res.json({ stats });
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ error: 'Failed to get dashboard stats' });
        }
    }
    // Get bot summary
    static async getBotSummary(req, res) {
        try {
            const { botId } = req.params;
            const userId = req.userId;
            const bot = await prisma_1.default.bot.findUnique({
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
            const recentAnalytics = await analyticsService_1.AnalyticsService.getBotAnalytics(botId, 7);
            res.json({
                bot,
                recentAnalytics,
            });
        }
        catch (error) {
            console.error('Get bot summary error:', error);
            res.status(500).json({ error: 'Failed to get bot summary' });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analyticsController.js.map