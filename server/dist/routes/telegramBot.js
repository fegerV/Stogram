"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const telegramBotController_1 = require("../controllers/telegramBotController");
const router = express_1.default.Router();
// Public webhook endpoint for Telegram (no auth required)
router.post('/webhook', telegramBotController_1.botWebhook);
// All other routes require authentication
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
// Test bot connection
router.post('/test-connection', telegramBotController_1.testBotConnection);
// Configuration
router.get('/config', telegramBotController_1.getBotConfig);
router.post('/config', telegramBotController_1.saveBotConfig);
// Stats
router.get('/stats', telegramBotController_1.getBotStats);
// Messaging
router.post('/send', telegramBotController_1.sendBotMessage);
router.post('/broadcast', telegramBotController_1.broadcastMessage);
// User management
router.get('/users', telegramBotController_1.getBotUsers);
router.post('/authorize', telegramBotController_1.authorizeUser);
exports.default = router;
//# sourceMappingURL=telegramBot.js.map