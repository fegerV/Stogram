import express from 'express';
import { auth } from '../middleware/auth';
import {
  searchMessages,
  searchByHashtag,
  searchByMention
} from '../controllers/searchController';

const router = express.Router();

router.get('/messages', auth, searchMessages);
router.get('/hashtag/:hashtag', auth, searchByHashtag);
router.get('/mentions/:username?', auth, searchByMention);

export default router;
