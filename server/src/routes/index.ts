import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import messageRoutes from './messageRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);

export default router;
