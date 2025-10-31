import express from 'express';
import { auth } from '../middleware/auth';
import {
  getChatSettings,
  updateChatSettings,
  muteChat,
  unmuteChat,
  toggleFavorite,
  updateUnreadCount,
  resetUnreadCount
} from '../controllers/chatSettingsController';

const router = express.Router();

router.get('/:chatId', auth, getChatSettings);
router.put('/:chatId', auth, updateChatSettings);
router.post('/:chatId/mute', auth, muteChat);
router.post('/:chatId/unmute', auth, unmuteChat);
router.post('/:chatId/favorite', auth, toggleFavorite);
router.put('/:chatId/unread', auth, updateUnreadCount);
router.post('/:chatId/unread/reset', auth, resetUnreadCount);

export default router;
