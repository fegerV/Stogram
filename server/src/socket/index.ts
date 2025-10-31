import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthSocket extends Socket {
  userId?: string;
}

const userSockets = new Map<string, string>();

export const initSocketHandlers = (io: Server) => {
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as { userId: string };

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    userSockets.set(userId, socket.id);

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE', lastSeen: new Date() },
    });

    io.emit('user:status', { userId, status: 'ONLINE' });

    const userChats = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });

    userChats.forEach(({ chatId }) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, type, replyToId } = data;

        const isMember = await prisma.chatMember.findFirst({
          where: { chatId, userId },
        });

        if (!isMember) {
          return socket.emit('error', { message: 'Not a member of this chat' });
        }

        const message = await prisma.message.create({
          data: {
            content,
            type: type || 'TEXT',
            senderId: userId,
            chatId,
            replyToId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            replyTo: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        io.to(`chat:${chatId}`).emit('message:new', message);
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('user:typing', {
        userId,
        chatId,
        isTyping,
      });
    });

    socket.on('message:read', async ({ messageId }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (message) {
          io.to(`chat:${message.chatId}`).emit('message:read', {
            messageId,
            userId,
          });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    socket.on('call:initiate', async (data) => {
      try {
        const { chatId, type } = data;

        const call = await prisma.call.create({
          data: {
            chatId,
            initiatorId: userId,
            type: type || 'AUDIO',
            status: 'CALLING',
          },
          include: {
            initiator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        });

        io.to(`chat:${chatId}`).emit('call:incoming', call);
      } catch (error) {
        console.error('Call initiate error:', error);
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    socket.on('call:answer', async ({ callId }) => {
      try {
        const call = await prisma.call.update({
          where: { id: callId },
          data: { status: 'ACTIVE' },
        });

        await prisma.callParticipant.create({
          data: {
            callId,
            userId,
          },
        });

        io.to(`chat:${call.chatId}`).emit('call:answered', { callId, userId });
      } catch (error) {
        console.error('Call answer error:', error);
      }
    });

    socket.on('call:reject', async ({ callId }) => {
      try {
        const call = await prisma.call.update({
          where: { id: callId },
          data: { status: 'DECLINED', endedAt: new Date() },
        });

        io.to(`chat:${call.chatId}`).emit('call:rejected', { callId, userId });
      } catch (error) {
        console.error('Call reject error:', error);
      }
    });

    socket.on('call:end', async ({ callId }) => {
      try {
        const call = await prisma.call.update({
          where: { id: callId },
          data: { status: 'ENDED', endedAt: new Date() },
        });

        io.to(`chat:${call.chatId}`).emit('call:ended', { callId });
      } catch (error) {
        console.error('Call end error:', error);
      }
    });

    socket.on('webrtc:offer', ({ callId, to, offer }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:offer', {
          callId,
          from: userId,
          offer,
        });
      }
    });

    socket.on('webrtc:answer', ({ callId, to, answer }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:answer', {
          callId,
          from: userId,
          answer,
        });
      }
    });

    socket.on('webrtc:ice-candidate', ({ callId, to, candidate }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:ice-candidate', {
          callId,
          from: userId,
          candidate,
        });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      userSockets.delete(userId);

      await prisma.user.update({
        where: { id: userId },
        data: { status: 'OFFLINE', lastSeen: new Date() },
      });

      io.emit('user:status', { userId, status: 'OFFLINE' });
    });
  });
};
