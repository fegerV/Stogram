import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFolders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        chatSettings: {
          include: {
            chat: {
              select: {
                id: true,
                name: true,
                type: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ folders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
};

export const createFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const maxOrder = await prisma.folder.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const folder = await prisma.folder.create({
      data: {
        userId,
        name,
        color: color || '#0088cc',
        icon: icon || 'Folder',
        order: (maxOrder?.order || 0) + 1
      }
    });

    res.status(201).json({ folder });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

export const updateFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { folderId } = req.params;
    const { name, color, icon, order } = req.body;

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: name || undefined,
        color: color || undefined,
        icon: icon || undefined,
        order: order !== undefined ? order : undefined
      }
    });

    res.json({ folder: updatedFolder });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { folderId } = req.params;

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Remove folder from all chat settings
    await prisma.chatSettings.updateMany({
      where: { folderId },
      data: { folderId: null }
    });

    await prisma.folder.delete({
      where: { id: folderId }
    });

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

export const addChatToFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { folderId, chatId } = req.params;

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        folderId
      },
      create: {
        userId,
        chatId,
        folderId
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Add chat to folder error:', error);
    res.status(500).json({ error: 'Failed to add chat to folder' });
  }
};

export const removeChatFromFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;

    const settings = await prisma.chatSettings.updateMany({
      where: {
        userId,
        chatId
      },
      data: {
        folderId: null
      }
    });

    res.json({ message: 'Chat removed from folder' });
  } catch (error) {
    console.error('Remove chat from folder error:', error);
    res.status(500).json({ error: 'Failed to remove chat from folder' });
  }
};
