import { Router } from 'express';
import {
  createChat,
  getChats,
  getChatById,
  updateChat,
  deleteChat,
  addMember,
  removeMember,
  pinMessage,
  unpinMessage,
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
router.patch('/:chatId/pin', pinMessage);
router.delete('/:chatId/pin', unpinMessage);

export default router;
