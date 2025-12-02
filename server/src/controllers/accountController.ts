import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

export const getStorageInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [
      messageCount,
      mediaMessages,
      contacts,
      chats,
      cacheEntries,
    ] = await Promise.all([
      prisma.message.count({
        where: { senderId: userId },
      }),
      prisma.message.findMany({
        where: {
          senderId: userId,
          fileSize: { not: null },
        },
        select: { fileSize: true },
      }),
      prisma.contact.count({
        where: { userId },
      }),
      prisma.chatMember.count({
        where: { userId },
      }),
      prisma.messageCache.count(),
    ]);

    const totalMediaBytes = mediaMessages.reduce(
      (sum, msg) => sum + (msg.fileSize || 0),
      0
    );

    const estimatedMessageBytes = messageCount * 500;
    const estimatedContactBytes = contacts * 200;
    const estimatedChatBytes = chats * 1000;
    const estimatedCacheBytes = cacheEntries * 5000;

    const totalEstimatedBytes =
      totalMediaBytes +
      estimatedMessageBytes +
      estimatedContactBytes +
      estimatedChatBytes +
      estimatedCacheBytes;

    res.json({
      messages: {
        count: messageCount,
        estimatedBytes: estimatedMessageBytes,
      },
      media: {
        count: mediaMessages.length,
        totalBytes: totalMediaBytes,
      },
      contacts: {
        count: contacts,
        estimatedBytes: estimatedContactBytes,
      },
      chats: {
        count: chats,
        estimatedBytes: estimatedChatBytes,
      },
      cache: {
        entriesCount: cacheEntries,
        estimatedBytes: estimatedCacheBytes,
      },
      total: {
        estimatedBytes: totalEstimatedBytes,
        formatted: formatBytes(totalEstimatedBytes),
      },
    });
  } catch (error) {
    console.error('Get storage info error:', error);
    res.status(500).json({ error: 'Failed to fetch storage information' });
  }
};

export const clearCache = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const userChats = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });

    const chatIds = userChats.map((cm) => cm.chatId);

    await prisma.messageCache.deleteMany({
      where: {
        chatId: { in: chatIds },
      },
    });

    const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || './uploads');
    const tempDir = path.join(uploadsDir, 'temp', userId);
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('No temp directory to clean:', tempDir);
    }

    res.json({
      message: 'Cache cleared successfully',
      cleared: {
        messageCacheEntries: chatIds.length,
        tempFiles: true,
      },
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [user, contacts, chatMembers, messages, folders, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          theme: true,
          showOnlineStatus: true,
          showProfilePhoto: true,
          showLastSeen: true,
          createdAt: true,
        },
      }),
      prisma.contact.findMany({
        where: { userId },
        include: {
          contact: {
            select: {
              username: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      prisma.chatMember.findMany({
        where: { userId },
        include: {
          chat: {
            select: {
              id: true,
              name: true,
              type: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.message.findMany({
        where: { senderId: userId },
        select: {
          id: true,
          content: true,
          type: true,
          chatId: true,
          createdAt: true,
        },
        take: 1000,
      }),
      prisma.folder.findMany({
        where: { userId },
      }),
      prisma.chatSettings.findMany({
        where: { userId },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      user,
      contacts,
      chats: chatMembers,
      messages,
      folders,
      settings,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stogram-export-${userId}-${Date.now()}.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

const importDataSchema = z.object({
  version: z.string(),
  user: z.object({
    displayName: z.string().optional(),
    bio: z.string().optional().nullable(),
    theme: z.string().optional().nullable(),
    showOnlineStatus: z.boolean().optional(),
    showProfilePhoto: z.boolean().optional(),
    showLastSeen: z.boolean().optional(),
  }).optional(),
  folders: z.array(z.object({
    name: z.string(),
    color: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    order: z.number(),
  })).optional(),
  settings: z.array(z.object({
    chatId: z.string(),
    isMuted: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })).optional(),
});

export const importData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const validatedData = importDataSchema.parse(req.body);

    if (validatedData.user) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          displayName: validatedData.user.displayName,
          bio: validatedData.user.bio,
          theme: validatedData.user.theme,
          showOnlineStatus: validatedData.user.showOnlineStatus,
          showProfilePhoto: validatedData.user.showProfilePhoto,
          showLastSeen: validatedData.user.showLastSeen,
        },
      });
    }

    if (validatedData.folders) {
      await prisma.folder.deleteMany({
        where: { userId },
      });

      for (const folder of validatedData.folders) {
        await prisma.folder.create({
          data: {
            userId,
            name: folder.name,
            color: folder.color,
            icon: folder.icon,
            order: folder.order,
          },
        });
      }
    }

    if (validatedData.settings) {
      for (const setting of validatedData.settings) {
        const chatMember = await prisma.chatMember.findFirst({
          where: {
            userId,
            chatId: setting.chatId,
          },
        });

        if (chatMember) {
          await prisma.chatSettings.upsert({
            where: {
              userId_chatId: {
                userId,
                chatId: setting.chatId,
              },
            },
            create: {
              userId,
              chatId: setting.chatId,
              isMuted: setting.isMuted || false,
              isFavorite: setting.isFavorite || false,
              isArchived: setting.isArchived || false,
            },
            update: {
              isMuted: setting.isMuted,
              isFavorite: setting.isFavorite,
              isArchived: setting.isArchived,
            },
          });
        }
      }
    }

    res.json({
      message: 'Data imported successfully',
      imported: {
        user: !!validatedData.user,
        folders: validatedData.folders?.length || 0,
        settings: validatedData.settings?.length || 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid import data format',
        details: error.errors,
      });
    }
    console.error('Import data error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
