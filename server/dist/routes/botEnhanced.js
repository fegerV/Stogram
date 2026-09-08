"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const botEnhancedController_1 = require("../controllers/botEnhancedController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Inline keyboard routes
router.post('/:botId/keyboards', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.createInlineKeyboard);
router.get('/:botId/keyboards', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.getInlineKeyboards);
router.delete('/keyboards/:keyboardId', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.deleteInlineKeyboard);
// Callback query routes
router.post('/callback-query', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.handleCallbackQuery);
router.post('/callback-query/:queryId/answer', botEnhancedController_1.BotEnhancedController.answerCallbackQuery);
router.get('/:botId/callback-queries', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.getCallbackQueries);
// Inline query routes
router.post('/inline-query', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.handleInlineQuery);
router.post('/inline-query/:queryId/answer', botEnhancedController_1.BotEnhancedController.answerInlineQuery);
router.get('/:botId/inline-queries', auth_1.authenticate, botEnhancedController_1.BotEnhancedController.getInlineQueries);
// Send message with keyboard
router.post('/send-with-keyboard', botEnhancedController_1.BotEnhancedController.sendMessageWithKeyboard);
exports.default = router;
//# sourceMappingURL=botEnhanced.js.map