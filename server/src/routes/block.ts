import express from 'express';
import { auth } from '../middleware/auth';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked
} from '../controllers/blockController';

const router = express.Router();

router.post('/:blockedId', auth, blockUser);
router.delete('/:blockedId', auth, unblockUser);
router.get('/', auth, getBlockedUsers);
router.get('/check/:targetUserId', auth, isUserBlocked);

export default router;
