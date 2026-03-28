import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// User analytics
router.get('/user', AnalyticsController.getUserAnalytics);

// Bot analytics
router.get('/bot/:botId', AnalyticsController.getBotAnalytics);
router.get('/bot/:botId/summary', AnalyticsController.getBotSummary);

// System analytics
router.get('/system', requireAdmin, AnalyticsController.getSystemAnalytics);
router.get('/dashboard', requireAdmin, AnalyticsController.getDashboardStats);

export default router;
