import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import messageRoutes from './messageRoutes';
import userRoutes from './userRoutes';
import reactionRoutes from './reactionRoutes';
import searchRoutes from './search';
import chatSettingsRoutes from './chatSettings';
import folderRoutes from './folder';
import blockRoutes from './block';
import pinnedMessageRoutes from './pinnedMessage';
import stickerRoutes from './sticker';
import botRoutes from './bot';
import webhookRoutes from './webhook';
// import n8nRoutes from './n8n';
// import telegramRoutes from './telegram';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);
router.use('/search', searchRoutes);
router.use('/chat-settings', chatSettingsRoutes);
router.use('/folders', folderRoutes);
router.use('/block', blockRoutes);
router.use('/pinned-messages', pinnedMessageRoutes);
router.use('/stickers', stickerRoutes);
router.use('/bots', botRoutes);
router.use('/webhooks', webhookRoutes);
// router.use('/n8n', n8nRoutes);
// router.use('/telegram', telegramRoutes);
router.use('/', reactionRoutes);

export default router;
