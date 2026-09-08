"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const telegramController_1 = require("../controllers/telegramController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Публичные маршруты
router.post('/webhook', telegramController_1.telegramController.webhook);
router.post('/auth', telegramController_1.telegramController.authTelegram);
router.post('/mini-app/auth', telegramController_1.telegramController.miniAppAuth);
// Защищенные маршруты (требуют авторизации)
router.use(auth_1.authenticateToken);
router.post('/link', telegramController_1.telegramController.linkAccount);
router.post('/unlink', telegramController_1.telegramController.unlinkAccount);
router.get('/settings', telegramController_1.telegramController.getSettings);
router.put('/settings', telegramController_1.telegramController.updateSettings);
router.post('/bridge', telegramController_1.telegramController.createBridge);
router.delete('/bridge/:bridgeId', telegramController_1.telegramController.deleteBridge);
router.patch('/bridge/:bridgeId/toggle', telegramController_1.telegramController.toggleBridge);
router.post('/test-notification', telegramController_1.telegramController.sendTestNotification);
exports.default = router;
//# sourceMappingURL=telegram.js.map