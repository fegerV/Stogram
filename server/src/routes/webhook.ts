import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createWebhook,
  getBotWebhooks,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  getBotWebhookDeliveries,
  testWebhook,
  retryDelivery
} from '../controllers/webhookController';

const router = express.Router();

// Все роуты защищены
router.post('/', authenticate, createWebhook);
router.get('/bot/:botId', authenticate, getBotWebhooks);
router.patch('/:webhookId', authenticate, updateWebhook);
router.delete('/:webhookId', authenticate, deleteWebhook);
router.get('/bot/:botId/deliveries', authenticate, getBotWebhookDeliveries);
router.get('/:webhookId/deliveries', authenticate, getWebhookDeliveries);
router.post('/:webhookId/test', authenticate, testWebhook);
router.post('/deliveries/:deliveryId/retry', authenticate, retryDelivery);

export default router;
