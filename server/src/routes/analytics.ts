import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';

const router = express.Router();

// User analytics
router.get('/user', AnalyticsController.getUserAnalytics);

// Bot analytics
router.get('/bot/:botId', AnalyticsController.getBotAnalytics);
router.get('/bot/:botId/summary', AnalyticsController.getBotSummary);

// System analytics
router.get('/system', AnalyticsController.getSystemAnalytics);
router.get('/dashboard', AnalyticsController.getDashboardStats);

export default router;
