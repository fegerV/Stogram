import express from 'express';
import { auth } from '../middleware/auth';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  addChatToFolder,
  removeChatFromFolder
} from '../controllers/folderController';

const router = express.Router();

router.get('/', auth, getFolders);
router.post('/', auth, createFolder);
router.put('/:folderId', auth, updateFolder);
router.delete('/:folderId', auth, deleteFolder);
router.post('/:folderId/chats/:chatId', auth, addChatToFolder);
router.delete('/chats/:chatId', auth, removeChatFromFolder);

export default router;
