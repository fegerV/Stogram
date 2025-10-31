import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createWebhook,
  getBotWebhooks,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  testWebhook
} from '../controllers/webhookController';

const router = express.Router();

// Все роуты защищены
router.post('/', authenticate, createWebhook);
router.get('/bot/:botId', authenticate, getBotWebhooks);
router.patch('/:webhookId', authenticate, updateWebhook);
router.delete('/:webhookId', authenticate, deleteWebhook);
router.get('/:webhookId/deliveries', authenticate, getWebhookDeliveries);
router.post('/:webhookId/test', authenticate, testWebhook);

export default router;
