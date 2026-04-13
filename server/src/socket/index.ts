import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import telegramService from '../services/telegramService';
import { getJwtSecret } from '../utils/authConfig';

interface AuthSocket extends Socket {
  userId?: string;
}

const userSockets = new Map<string, Set<string>>();
const callTimeouts = new Map<string, NodeJS.Timeout>();

const registerSocket = (userId: string, socketId: string) => {
  const sockets = userSockets.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  userSockets.set(userId, sockets);
};

const unregisterSocket = (userId: string, socketId: string) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
};

const hasActiveSocket = (userId: string) => {
  return (userSockets.get(userId)?.size ?? 0) > 0;
};

const emitToUser = (io: Server, userId: string, event: string, payload: unknown) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  for (const socketId of sockets) {
    io.to(socketId).emit(event, payload);
  }
};

const clearCallTimeout = (callId: string) => {
  const timeout = callTimeouts.get(callId);
  if (timeout) {
    clearTimeout(timeout);
    callTimeouts.delete(callId);
  }
};

const scheduleMissedCallTimeout = (io: Server, callId: string, chatId: string) => {
  clearCallTimeout(callId);
  callTimeouts.set(
    callId,
    setTimeout(async () => {
      try {
        const currentCall = await prisma.call.findUnique({
          where: { id: callId },
        });

        if (!currentCall || currentCall.status !== 'CALLING') {
          return;
        }

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'MISSED', endedAt: new Date() },
        });

        io.to(`chat:${chatId}`).emit('call:missed', { callId });
      } catch (error) {
        console.error('Call timeout error:', error);
      } finally {
        clearCallTimeout(callId);
      }
    }, 30000)
  );
};

const ensureChatMembership = async (chatId: string, userId: string) =>
  prisma.chatMember.findFirst({
    where: { chatId, userId },
    select: { chatId: true },
  });

const getAccessibleMessage = async (messageId: string, userId: string) =>
  prisma.message.findFirst({
    where: {
      id: messageId,
      chat: {
        members: {
          some: { userId },
        },
      },
    },
    select: {
      id: true,
      chatId: true,
    },
  });

export const initSocketHandlers = (io: Server) => {
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string;
        sessionId?: string;
      };

      if (!decoded.sessionId) {
        return next(new Error('Authentication error'));
      }

      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: { id: true },
      });

      if (!session) {
        return next(new Error('Authentication error'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    registerSocket(userId, socket.id);

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE', lastSeen: new Date() },
    });

    io.emit('user:status', { userId, status: 'ONLINE' });

    const userChats = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });

    userChats.forEach(({ chatId }: { chatId: string }) => {
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

        const chatMembers = await prisma.chatMember.findMany({
          where: { chatId },
          include: { user: true },
        });

        for (const member of chatMembers) {
          if (
            member.userId !== userId &&
            member.user.telegramId &&
            member.user.telegramNotifications &&
            !hasActiveSocket(member.userId)
          ) {
            const senderName = message.sender.displayName || message.sender.username;
            await telegramService.sendNotification(
              member.user.telegramId,
              `рџ’¬ РќРѕРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ РѕС‚ *${senderName}*\n\n${content}`
            );
          }
        }

        const bridges = await prisma.telegramChatBridge.findMany({
          where: {
            stogramChatId: chatId,
            isActive: true,
          },
        });

        for (const bridge of bridges) {
          try {
            await telegramService.syncMessageToTelegram(bridge.id, message);
          } catch (error) {
            console.error('Failed to sync message to Telegram:', error);
          }
        }
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:typing', async ({ chatId, isTyping }) => {
      try {
        const membership = await ensureChatMembership(chatId, userId);
        if (!membership) {
          return socket.emit('error', { message: 'Not a member of this chat' });
        }

        socket.to(`chat:${chatId}`).emit('user:typing', {
          userId,
          chatId,
          isTyping,
        });
      } catch (error) {
        console.error('Message typing error:', error);
      }
    });

    socket.on('message:read', async ({ messageId }) => {
      try {
        const message = await getAccessibleMessage(messageId, userId);

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
        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            members: {
              some: { userId },
            },
          },
          include: {
            members: {
              select: { userId: true },
            },
          },
        });

        if (!chat) {
          return socket.emit('error', { message: 'Not a member of this chat' });
        }

        if (chat.type !== 'PRIVATE') {
          return socket.emit('error', { message: 'Calls are currently supported only in private chats' });
        }

        const existingCall = await prisma.call.findFirst({
          where: {
            chatId,
            status: { in: ['CALLING', 'ACTIVE'] },
          },
        });

        if (existingCall) {
          return socket.emit('error', { message: 'A call is already in progress in this chat' });
        }

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

        await prisma.callParticipant.create({
          data: {
            callId: call.id,
            userId,
          },
        });

        for (const member of chat.members) {
          if (member.userId !== userId) {
            emitToUser(io, member.userId, 'call:incoming', call);
          }
        }

        socket.emit('call:initiated', { callId: call.id, call });
        scheduleMissedCallTimeout(io, call.id, chatId);
      } catch (error) {
        console.error('Call initiate error:', error);
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    socket.on('call:answer', async ({ callId }) => {
      try {
        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: {
            chat: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
        });

        if (!call) {
          return socket.emit('error', { message: 'Call not found' });
        }

        if (call.status !== 'CALLING') {
          return socket.emit('error', { message: 'Call is no longer available' });
        }

        if (!call.chat.members.some((member) => member.userId === userId)) {
          return socket.emit('error', { message: 'Not allowed to answer this call' });
        }

        if (call.initiatorId === userId) {
          return socket.emit('error', { message: 'Initiator cannot answer their own call' });
        }

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'ACTIVE' },
        });

        await prisma.callParticipant.upsert({
          where: {
            callId_userId: {
              callId,
              userId,
            },
          },
          update: {
            leftAt: null,
          },
          create: {
            callId,
            userId,
          },
        });

        clearCallTimeout(callId);
        io.to(`chat:${call.chatId}`).emit('call:answered', { callId, userId });
      } catch (error) {
        console.error('Call answer error:', error);
      }
    });

    socket.on('call:reject', async ({ callId }) => {
      try {
        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: {
            chat: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
        });

        if (!call) {
          return socket.emit('error', { message: 'Call not found' });
        }

        if (!call.chat.members.some((member) => member.userId === userId)) {
          return socket.emit('error', { message: 'Not allowed to reject this call' });
        }

        if (!['CALLING', 'ACTIVE'].includes(call.status)) {
          return socket.emit('error', { message: 'Call is no longer active' });
        }

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'DECLINED', endedAt: new Date() },
        });

        await prisma.callParticipant.updateMany({
          where: {
            callId,
            userId,
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
          },
        });

        clearCallTimeout(callId);
        io.to(`chat:${call.chatId}`).emit('call:rejected', { callId, userId });
      } catch (error) {
        console.error('Call reject error:', error);
      }
    });

    socket.on('call:end', async ({ callId }) => {
      try {
        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: {
            chat: {
              include: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
        });

        if (!call) {
          return socket.emit('error', { message: 'Call not found' });
        }

        if (!call.chat.members.some((member) => member.userId === userId)) {
          return socket.emit('error', { message: 'Not allowed to end this call' });
        }

        if (!['CALLING', 'ACTIVE'].includes(call.status)) {
          return socket.emit('error', { message: 'Call is already ended' });
        }

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'ENDED', endedAt: new Date() },
        });

        await prisma.callParticipant.updateMany({
          where: {
            callId,
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
          },
        });

        clearCallTimeout(callId);
        io.to(`chat:${call.chatId}`).emit('call:ended', { callId });
      } catch (error) {
        console.error('Call end error:', error);
      }
    });

    socket.on('call:toggle-recording', async ({ callId, isRecording }) => {
      try {
        const call = await prisma.call.findUnique({
          where: { id: callId },
        });

        if (!call) {
          return socket.emit('error', { message: 'Call not found' });
        }

        if (call.initiatorId !== userId) {
          return socket.emit('error', { message: 'Only initiator can control recording' });
        }

        await prisma.call.update({
          where: { id: callId },
          data: { isRecording },
        });

        io.to(`chat:${call.chatId}`).emit('call:recording-status', { callId, isRecording });
      } catch (error) {
        console.error('Call recording toggle error:', error);
      }
    });

    socket.on('call:save-recording', async ({ callId, recordingUrl }) => {
      try {
        const call = await prisma.call.findUnique({
          where: { id: callId },
        });

        if (!call) {
          return socket.emit('error', { message: 'Call not found' });
        }

        if (call.initiatorId !== userId) {
          return socket.emit('error', { message: 'Only initiator can save recording' });
        }

        await prisma.call.update({
          where: { id: callId },
          data: { recordingUrl, isRecording: false },
        });

        io.to(`chat:${call.chatId}`).emit('call:recording-saved', { callId, recordingUrl });
      } catch (error) {
        console.error('Call save recording error:', error);
      }
    });

    socket.on('webrtc:offer', async ({ callId, to, offer }) => {
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: {
          chat: {
            include: {
              members: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!call || !['CALLING', 'ACTIVE'].includes(call.status)) {
        return;
      }

      const memberIds = new Set(call.chat.members.map((member) => member.userId));
      if (!memberIds.has(userId) || !memberIds.has(to)) {
        return socket.emit('error', { message: 'Invalid WebRTC target' });
      }

      emitToUser(io, to, 'webrtc:offer', {
        callId,
        from: userId,
        offer,
      });
    });

    socket.on('webrtc:answer', async ({ callId, to, answer }) => {
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: {
          chat: {
            include: {
              members: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!call || !['CALLING', 'ACTIVE'].includes(call.status)) {
        return;
      }

      const memberIds = new Set(call.chat.members.map((member) => member.userId));
      if (!memberIds.has(userId) || !memberIds.has(to)) {
        return socket.emit('error', { message: 'Invalid WebRTC target' });
      }

      emitToUser(io, to, 'webrtc:answer', {
        callId,
        from: userId,
        answer,
      });
    });

    socket.on('webrtc:ice-candidate', async ({ callId, to, candidate }) => {
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: {
          chat: {
            include: {
              members: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!call || !['CALLING', 'ACTIVE'].includes(call.status)) {
        return;
      }

      const memberIds = new Set(call.chat.members.map((member) => member.userId));
      if (!memberIds.has(userId) || !memberIds.has(to)) {
        return socket.emit('error', { message: 'Invalid WebRTC target' });
      }

      emitToUser(io, to, 'webrtc:ice-candidate', {
        callId,
        from: userId,
        candidate,
      });
    });

    socket.on('chat:pin-message', async ({ chatId, messageId }) => {
      try {
        const isMember = await prisma.chatMember.findFirst({
          where: {
            chatId,
            userId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        });

        if (!isMember) {
          return socket.emit('error', { message: 'Only owners and admins can pin messages' });
        }

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.chatId !== chatId) {
          return socket.emit('error', { message: 'Message not found' });
        }

        const chat = await prisma.chat.update({
          where: { id: chatId },
          data: { pinnedMessageId: messageId },
          include: {
            pinnedMessage: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        });

        io.to(`chat:${chatId}`).emit('chat:pin-updated', { chat });
      } catch (error) {
        console.error('Pin message socket error:', error);
        socket.emit('error', { message: 'Failed to pin message' });
      }
    });

    socket.on('chat:unpin-message', async ({ chatId }) => {
      try {
        const isMember = await prisma.chatMember.findFirst({
          where: {
            chatId,
            userId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        });

        if (!isMember) {
          return socket.emit('error', { message: 'Only owners and admins can unpin messages' });
        }

        const chat = await prisma.chat.update({
          where: { id: chatId },
          data: { pinnedMessageId: null },
          include: {
            pinnedMessage: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        });

        io.to(`chat:${chatId}`).emit('chat:pin-updated', { chat });
      } catch (error) {
        console.error('Unpin message socket error:', error);
        socket.emit('error', { message: 'Failed to unpin message' });
      }
    });

    socket.on('chat:update-notifications', async ({ chatId, level }) => {
      try {
        const isMember = await prisma.chatMember.findFirst({
          where: { chatId, userId },
        });

        if (!isMember) {
          return socket.emit('error', { message: 'Not a member of this chat' });
        }

        const settings = await prisma.chatSettings.upsert({
          where: {
            userId_chatId: {
              userId,
              chatId,
            },
          },
          update: {
            notificationLevel: level,
            isMuted: level === 'MUTED',
          },
          create: {
            userId,
            chatId,
            notificationLevel: level,
            isMuted: level === 'MUTED',
          },
        });

        socket.emit('chat:notification-updated', { settings });
      } catch (error) {
        console.error('Update notification socket error:', error);
        socket.emit('error', { message: 'Failed to update notification settings' });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      unregisterSocket(userId, socket.id);

      if (hasActiveSocket(userId)) {
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { status: 'OFFLINE', lastSeen: new Date() },
      });

      io.emit('user:status', { userId, status: 'OFFLINE' });
    });
  });
};
