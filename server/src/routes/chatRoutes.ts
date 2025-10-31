import { Router } from 'express';
import {
  createChat,
  getChats,
  getChatById,
  updateChat,
  deleteChat,
  addMember,
  removeMember,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:chatId', getChatById);
router.patch('/:chatId', updateChat);
router.delete('/:chatId', deleteChat);
router.post('/:chatId/members', addMember);
router.delete('/:chatId/members/:memberId', removeMember);

export default router;
