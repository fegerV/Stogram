import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getN8nConfig,
  saveN8nConfig,
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
  getWorkflows,
  triggerWorkflow,
  n8nWebhook,
} from '../controllers/n8nSettingsController';

const router = express.Router();

// Public webhook endpoint for n8n (no auth required)
router.post('/webhook', n8nWebhook);

// All other routes require authentication
router.use(authenticate);

// Configuration
router.get('/config', getN8nConfig);
router.post('/config', saveN8nConfig);

// Webhooks CRUD
router.get('/webhooks', getWebhooks);
router.post('/webhooks', createWebhook);
router.put('/webhooks/:id', updateWebhook);
router.delete('/webhooks/:id', deleteWebhook);
router.get('/webhooks/:id/logs', getWebhookLogs);

// Test webhook
router.post('/test', testWebhook);

// Workflows
router.get('/workflows', getWorkflows);
router.post('/trigger/:workflowId', triggerWorkflow);

export default router;
