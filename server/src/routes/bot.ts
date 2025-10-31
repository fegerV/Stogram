import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createBot,
  getUserBots,
  getBot,
  updateBot,
  deleteBot,
  addBotCommand,
  deleteBotCommand,
  regenerateBotToken,
  sendBotMessage
} from '../controllers/botController';

const router = express.Router();

// Публичные роуты
router.get('/:botId', getBot);

// Защищенные роуты
router.get('/', authenticate, getUserBots);
router.post('/', authenticate, createBot);
router.patch('/:botId', authenticate, updateBot);
router.delete('/:botId', authenticate, deleteBot);
router.post('/:botId/commands', authenticate, addBotCommand);
router.delete('/commands/:commandId', authenticate, deleteBotCommand);
router.post('/:botId/regenerate-token', authenticate, regenerateBotToken);

// Bot API endpoint (использует токен бота, не пользовательский JWT)
router.post('/send-message', sendBotMessage);

export default router;
