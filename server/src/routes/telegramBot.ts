import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getBotConfig,
  saveBotConfig,
  botWebhook,
  getBotStats,
  sendBotMessage,
  getBotUsers,
  authorizeUser,
  broadcastMessage,
  testBotConnection,
} from '../controllers/telegramBotController';

const router = express.Router();

// Public webhook endpoint for Telegram (no auth required)
router.post('/webhook', botWebhook);

// Test bot connection (no auth for initial setup)
router.post('/test-connection', testBotConnection);

// All other routes require authentication
router.use(authenticate);
router.use(requireAdmin);

// Configuration
router.get('/config', getBotConfig);
router.post('/config', saveBotConfig);

// Stats
router.get('/stats', getBotStats);

// Messaging
router.post('/send', sendBotMessage);
router.post('/broadcast', broadcastMessage);

// User management
router.get('/users', getBotUsers);
router.post('/authorize', authorizeUser);

export default router;
