"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const webhookController_1 = require("../controllers/webhookController");
const router = express_1.default.Router();
// Все роуты защищены
router.post('/', auth_1.authenticate, webhookController_1.createWebhook);
router.get('/bot/:botId', auth_1.authenticate, webhookController_1.getBotWebhooks);
router.patch('/:webhookId', auth_1.authenticate, webhookController_1.updateWebhook);
router.delete('/:webhookId', auth_1.authenticate, webhookController_1.deleteWebhook);
router.get('/bot/:botId/deliveries', auth_1.authenticate, webhookController_1.getBotWebhookDeliveries);
router.get('/:webhookId/deliveries', auth_1.authenticate, webhookController_1.getWebhookDeliveries);
router.post('/:webhookId/test', auth_1.authenticate, webhookController_1.testWebhook);
router.post('/deliveries/:deliveryId/retry', auth_1.authenticate, webhookController_1.retryDelivery);
exports.default = router;
//# sourceMappingURL=webhook.js.map