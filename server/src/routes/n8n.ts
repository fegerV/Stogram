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
router.get('/events', authenticate, getEvents);
router.get('/chats', authenticate, getChatsForN8n);
router.post('/messages/send', authenticate, sendMessageFromN8n);
router.get('/chats/:chatId/messages', authenticate, getChatMessagesForN8n);
router.post('/chats', authenticate, createChatFromN8n);
router.get('/users/:userId', authenticate, getUserInfoForN8n);

export default router;
