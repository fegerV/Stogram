import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/:chatId', getMessages);
router.post('/:chatId', upload.single('file'), sendMessage);
router.patch('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;
