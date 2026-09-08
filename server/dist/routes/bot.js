"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const botController_1 = require("../controllers/botController");
const router = express_1.default.Router();
router.get('/', auth_1.authenticate, botController_1.getUserBots);
router.get('/:botId', auth_1.authenticate, botController_1.getBot);
router.post('/', auth_1.authenticate, botController_1.createBot);
router.patch('/:botId', auth_1.authenticate, botController_1.updateBot);
router.delete('/:botId', auth_1.authenticate, botController_1.deleteBot);
router.get('/:botId/installations', auth_1.authenticate, botController_1.listBotInstallations);
router.post('/:botId/installations', auth_1.authenticate, botController_1.installBot);
router.delete('/:botId/installations/:chatId', auth_1.authenticate, botController_1.uninstallBot);
router.post('/:botId/commands', auth_1.authenticate, botController_1.addBotCommand);
router.delete('/commands/:commandId', auth_1.authenticate, botController_1.deleteBotCommand);
router.post('/:botId/regenerate-token', auth_1.authenticate, botController_1.regenerateBotToken);
router.post('/send-message', (req, res) => (0, botController_1.sendBotMessage)(req, res));
exports.default = router;
//# sourceMappingURL=bot.js.map