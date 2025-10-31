import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import messageRoutes from './messageRoutes';
import userRoutes from './userRoutes';
import reactionRoutes from './reactionRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);
router.use('/', reactionRoutes);

export default router;
