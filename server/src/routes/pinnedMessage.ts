import express from 'express';
import { auth } from '../middleware/auth';
import {
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  getAllPinnedMessages
} from '../controllers/pinnedMessageController';

const router = express.Router();

router.post('/', auth, pinMessage);
router.delete('/:messageId/:chatId', auth, unpinMessage);
router.get('/chat/:chatId', auth, getPinnedMessages);
router.get('/all', auth, getAllPinnedMessages);

export default router;
