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
  sendBotMessage,
  listBotInstallations,
  installBot,
  uninstallBot,
} from '../controllers/botController';

const router = express.Router();

router.get('/', authenticate, getUserBots);
router.get('/:botId', authenticate, getBot);
router.post('/', authenticate, createBot);
router.patch('/:botId', authenticate, updateBot);
router.delete('/:botId', authenticate, deleteBot);
router.get('/:botId/installations', authenticate, listBotInstallations);
router.post('/:botId/installations', authenticate, installBot);
router.delete('/:botId/installations/:chatId', authenticate, uninstallBot);
router.post('/:botId/commands', authenticate, addBotCommand);
router.delete('/commands/:commandId', authenticate, deleteBotCommand);
router.post('/:botId/regenerate-token', authenticate, regenerateBotToken);

router.post('/send-message', (req, res) => sendBotMessage(req as any, res as any));

export default router;
