import express from 'express';
import { BotEnhancedController } from '../controllers/botEnhancedController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Inline keyboard routes
router.post('/:botId/keyboards', authenticate, BotEnhancedController.createInlineKeyboard);
router.get('/:botId/keyboards', authenticate, BotEnhancedController.getInlineKeyboards);
router.delete('/keyboards/:keyboardId', authenticate, BotEnhancedController.deleteInlineKeyboard);

// Callback query routes
router.post('/callback-query', authenticate, BotEnhancedController.handleCallbackQuery);
router.post('/callback-query/:queryId/answer', BotEnhancedController.answerCallbackQuery);
router.get('/:botId/callback-queries', authenticate, BotEnhancedController.getCallbackQueries);

// Inline query routes
router.post('/inline-query', authenticate, BotEnhancedController.handleInlineQuery);
router.post('/inline-query/:queryId/answer', BotEnhancedController.answerInlineQuery);
router.get('/:botId/inline-queries', authenticate, BotEnhancedController.getInlineQueries);

// Send message with keyboard
router.post('/send-with-keyboard', BotEnhancedController.sendMessageWithKeyboard);

export default router;
