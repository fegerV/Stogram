import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getEvents,
  getChatsForN8n,
  sendMessageFromN8n,
  getChatMessagesForN8n,
  createChatFromN8n,
  getUserInfoForN8n
} from '../controllers/n8nController';

const router = express.Router();

// Все роуты n8n требуют авторизации
router.use(authenticate);

router.get('/events', getEvents);
router.get('/chats', getChatsForN8n);
router.post('/messages/send', sendMessageFromN8n);
router.get('/chats/:chatId/messages', getChatMessagesForN8n);
router.post('/chats', createChatFromN8n);
router.get('/users/:userId', getUserInfoForN8n);

export default router;
