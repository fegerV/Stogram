import express from 'express';
import { BotEnhancedController } from '../controllers/botEnhancedController';

const router = express.Router();

// Inline keyboard routes
router.post('/:botId/keyboards', BotEnhancedController.createInlineKeyboard);
router.get('/:botId/keyboards', BotEnhancedController.getInlineKeyboards);
router.delete('/keyboards/:keyboardId', BotEnhancedController.deleteInlineKeyboard);

// Callback query routes
router.post('/callback-query', BotEnhancedController.handleCallbackQuery);
router.post('/callback-query/:queryId/answer', BotEnhancedController.answerCallbackQuery);
router.get('/:botId/callback-queries', BotEnhancedController.getCallbackQueries);

// Inline query routes
router.post('/inline-query', BotEnhancedController.handleInlineQuery);
router.post('/inline-query/:queryId/answer', BotEnhancedController.answerInlineQuery);
router.get('/:botId/inline-queries', BotEnhancedController.getInlineQueries);

// Send message with keyboard
router.post('/send-with-keyboard', BotEnhancedController.sendMessageWithKeyboard);

export default router;
