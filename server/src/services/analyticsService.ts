import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  // Track user activity
  static async trackUserActivity(userId: string, activityType: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.userAnalytics.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (analytics) {
      const updates: any = {};
      
      switch (activityType) {
        case 'message_sent':
          updates.messagesSent = analytics.messagesSent + 1;
          break;
        case 'message_received':
          updates.messagesReceived = analytics.messagesReceived + 1;
          break;
        case 'call_made':
          updates.callsMade = analytics.callsMade + 1;
          break;
        case 'call_received':
          updates.callsReceived = analytics.callsReceived + 1;
          break;
      }

      await prisma.userAnalytics.update({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        data: updates,
      });
    } else {
      const data: any = {
        userId,
        date: today,
        messagesSent: 0,
        messagesReceived: 0,
        callsMade: 0,
        callsReceived: 0,
        activeMinutes: 0,
      };

      if (activityType === 'message_sent') data.messagesSent = 1;
      if (activityType === 'message_received') data.messagesReceived = 1;
      if (activityType === 'call_made') data.callsMade = 1;
      if (activityType === 'call_received') data.callsReceived = 1;

      await prisma.userAnalytics.create({ data });
    }
  }

  // Track bot activity
  static async trackBotActivity(
    botId: string,
    activityType: 'message_sent' | 'message_received',
    userId?: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.botAnalytics.findUnique({
      where: {
        botId_date: {
          botId,
          date: today,
        },
      },
    });

    if (analytics) {
      const updates: any = {};
      
      if (activityType === 'message_sent') {
        updates.messagesSent = analytics.messagesSent + 1;
      } else {
        updates.messagesReceived = analytics.messagesReceived + 1;
      }

      // Track unique users
      if (userId) {
        // In production, use a Set or separate table for unique users
        updates.uniqueUsers = analytics.uniqueUsers + 1;
      }

      await prisma.botAnalytics.update({
        where: {
          botId_date: {
            botId,
            date: today,
          },
        },
        data: updates,
      });
    } else {
      await prisma.botAnalytics.create({
        data: {
          botId,
          date: today,
          messagesSent: activityType === 'message_sent' ? 1 : 0,
          messagesReceived: activityType === 'message_received' ? 1 : 0,
          uniqueUsers: userId ? 1 : 0,
        },
      });
    }

    // Update bot totals
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { messagesSent: true, messagesReceived: true, uniqueUsers: true },
    });

    if (bot) {
      const updates: any = {};
      
      if (activityType === 'message_sent') {
        updates.messagesSent = bot.messagesSent + 1;
      } else {
        updates.messagesReceived = bot.messagesReceived + 1;
      }

      if (userId) {
        updates.uniqueUsers = bot.uniqueUsers + 1;
      }

      await prisma.bot.update({
        where: { id: botId },
        data: updates,
      });
    }
  }

  // Track bot command usage
  static async trackBotCommand(botId: string, command: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.botAnalytics.findUnique({
      where: {
        botId_date: {
          botId,
          date: today,
        },
      },
    });

    if (analytics) {
      const commands = analytics.commands ? JSON.parse(analytics.commands) : {};
      commands[command] = (commands[command] || 0) + 1;

      await prisma.botAnalytics.update({
        where: {
          botId_date: {
            botId,
            date: today,
          },
        },
        data: {
          commands: JSON.stringify(commands),
        },
      });
    }
  }

  // Update system analytics
  static async updateSystemAnalytics(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await prisma.user.count();
    
    // Active users (logged in last 24 hours)
    const activeUsers = await prisma.user.count({
      where: {
        lastSeen: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalMessages = await prisma.message.count();
    const totalCalls = await prisma.call.count();

    // Calculate total storage (simplified - in production, sum actual file sizes)
    const messages = await prisma.message.findMany({
      where: {
        fileSize: { not: null },
      },
      select: {
        fileSize: true,
      },
    });

    const totalStorage = messages.reduce((sum, msg) => sum + (msg.fileSize || 0), 0);

    await prisma.systemAnalytics.upsert({
      where: { date: today },
      update: {
        totalUsers,
        activeUsers,
        totalMessages,
        totalCalls,
        totalStorage: BigInt(totalStorage),
      },
      create: {
        date: today,
        totalUsers,
        activeUsers,
        totalMessages,
        totalCalls,
        totalStorage: BigInt(totalStorage),
        avgResponseTime: 0,
        errorCount: 0,
      },
    });
  }

  // Get user analytics
  static async getUserAnalytics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await prisma.userAnalytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // Get bot analytics
  static async getBotAnalytics(botId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await prisma.botAnalytics.findMany({
      where: {
        botId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // Get system analytics
  static async getSystemAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await prisma.systemAnalytics.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastSeen: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const todayMessages = await prisma.message.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const todayCalls = await prisma.call.count({
      where: {
        startedAt: {
          gte: today,
        },
      },
    });

    const activeBots = await prisma.bot.count({
      where: { isActive: true },
    });

    return {
      totalUsers,
      activeUsers,
      todayMessages,
      todayCalls,
      activeBots,
    };
  }

  // Track active minutes for user
  static async trackActiveMinutes(userId: string, minutes: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.userAnalytics.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (analytics) {
      await prisma.userAnalytics.update({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        data: {
          activeMinutes: analytics.activeMinutes + minutes,
        },
      });
    }
  }
}
