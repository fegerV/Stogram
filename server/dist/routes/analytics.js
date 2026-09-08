"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
// User analytics
router.get('/user', analyticsController_1.AnalyticsController.getUserAnalytics);
// Bot analytics
router.get('/bot/:botId', analyticsController_1.AnalyticsController.getBotAnalytics);
router.get('/bot/:botId/summary', analyticsController_1.AnalyticsController.getBotSummary);
// System analytics
router.get('/system', auth_1.requireAdmin, analyticsController_1.AnalyticsController.getSystemAnalytics);
router.get('/dashboard', auth_1.requireAdmin, analyticsController_1.AnalyticsController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=analytics.js.map