import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getStickerPacks,
  getStickerPack,
  createStickerPack,
  addStickerToPack,
  deleteSticker,
  deleteStickerPack
} from '../controllers/stickerController';

const router = express.Router();

// Публичные роуты
router.get('/', getStickerPacks);
router.get('/:slug', getStickerPack);

// Защищенные роуты
router.post('/', authenticate, createStickerPack);
router.post('/:packId/stickers', authenticate, addStickerToPack);
router.delete('/stickers/:stickerId', authenticate, deleteSticker);
router.delete('/:packId', authenticate, deleteStickerPack);

export default router;
