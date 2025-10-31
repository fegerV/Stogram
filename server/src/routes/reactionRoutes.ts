import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  addReaction,
  removeReaction,
  getReactions,
} from '../controllers/reactionController';

const router = Router();

router.post('/messages/:messageId/reactions', auth, addReaction);
router.delete('/messages/:messageId/reactions/:emoji', auth, removeReaction);
router.get('/messages/:messageId/reactions', auth, getReactions);

export default router;
