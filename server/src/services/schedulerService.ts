import cron from 'node-cron';
import { prisma } from '../index';
import { io } from '../index';

/**
 * Check and send scheduled messages
 */
export const checkScheduledMessages = async (): Promise<void> => {
  try {
    const now = new Date();

    // Find all scheduled messages that should be sent now
    const scheduledMessages = await prisma.message.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        isSent: false,
        isDeleted: false,
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
        chat: {
          include: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    for (const message of scheduledMessages) {
      try {
        // Mark as sent
        const sentMessage = await prisma.message.update({
          where: { id: message.id },
          data: { isSent: true },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                lastSeen: true,
                createdAt: true,
              },
            },
            replyTo: {
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

        // Emit to all chat members
        const memberIds = message.chat.members.map((m: { userId: string }) => m.userId);
        memberIds.forEach((userId: string) => {
          io.to(`user:${userId}`).emit('message:new', sentMessage);
        });

        console.log(`Scheduled message ${message.id} sent successfully`);
      } catch (error) {
        console.error(`Error sending scheduled message ${message.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking scheduled messages:', error);
  }
};

/**
 * Initialize scheduler
 */
export const initScheduler = (): void => {
  // Run every minute to check for scheduled messages
  cron.schedule('* * * * *', () => {
    checkScheduledMessages();
  });

  console.log('📅 Message scheduler initialized');
};
