"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const n8nSettingsController_1 = require("../controllers/n8nSettingsController");
const router = express_1.default.Router();
// Public webhook endpoint for n8n (no auth required)
router.post('/webhook', n8nSettingsController_1.n8nWebhook);
// All other routes require authentication
router.use(auth_1.authenticate);
// Configuration
router.get('/config', n8nSettingsController_1.getN8nConfig);
router.post('/config', n8nSettingsController_1.saveN8nConfig);
// Webhooks CRUD - теперь каждый пользователь имеет свои вебхуки
router.get('/webhooks', n8nSettingsController_1.getWebhooks);
router.post('/webhooks', n8nSettingsController_1.createWebhook);
router.put('/webhooks/:id', n8nSettingsController_1.updateWebhook);
router.delete('/webhooks/:id', n8nSettingsController_1.deleteWebhook);
router.get('/webhooks/:id/logs', n8nSettingsController_1.getWebhookLogs);
// Test webhook
router.post('/test', n8nSettingsController_1.testWebhook);
// Workflows
router.get('/workflows', n8nSettingsController_1.getWorkflows);
router.post('/trigger/:workflowId', n8nSettingsController_1.triggerWorkflow);
exports.default = router;
//# sourceMappingURL=n8n.js.map