import express from 'express';
import { telegramController } from '../controllers/telegramController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Публичные маршруты
router.post('/webhook', telegramController.webhook);
router.post('/auth', telegramController.authTelegram);
router.post('/mini-app/auth', telegramController.miniAppAuth);

// Защищенные маршруты (требуют авторизации)
router.use(authenticateToken);

router.post('/link', telegramController.linkAccount);
router.post('/unlink', telegramController.unlinkAccount);
router.get('/settings', telegramController.getSettings);
router.put('/settings', telegramController.updateSettings);

router.post('/bridge', telegramController.createBridge);
router.delete('/bridge/:bridgeId', telegramController.deleteBridge);
router.patch('/bridge/:bridgeId/toggle', telegramController.toggleBridge);

router.post('/test-notification', telegramController.sendTestNotification);

export default router;
