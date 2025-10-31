import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Получить все публичные паки стикеров
export const getStickerPacks = async (req: Request, res: Response) => {
  try {
    const packs = await prisma.stickerPack.findMany({
      where: { isPublic: true },
      include: {
        stickers: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(packs);
  } catch (error) {
    console.error('Error fetching sticker packs:', error);
    res.status(500).json({ error: 'Failed to fetch sticker packs' });
  }
};

// Получить конкретный пак стикеров
export const getStickerPack = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const pack = await prisma.stickerPack.findUnique({
      where: { slug },
      include: {
        stickers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!pack) {
      return res.status(404).json({ error: 'Sticker pack not found' });
    }

    res.json(pack);
  } catch (error) {
    console.error('Error fetching sticker pack:', error);
    res.status(500).json({ error: 'Failed to fetch sticker pack' });
  }
};

// Создать новый пак стикеров
export const createStickerPack = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, slug, description, thumbnail, isPublic } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const pack = await prisma.stickerPack.create({
      data: {
        name,
        slug,
        description,
        thumbnail,
        isPublic: isPublic ?? true,
        creatorId: userId
      }
    });

    res.status(201).json(pack);
  } catch (error: any) {
    console.error('Error creating sticker pack:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Sticker pack with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create sticker pack' });
  }
};

// Добавить стикер в пак
export const addStickerToPack = async (req: Request, res: Response) => {
  try {
    const { packId } = req.params;
    const { emoji, imageUrl, width, height, order } = req.body;

    if (!imageUrl || !width || !height) {
      return res.status(400).json({ error: 'ImageUrl, width, and height are required' });
    }

    const sticker = await prisma.sticker.create({
      data: {
        packId,
        emoji,
        imageUrl,
        width,
        height,
        order: order ?? 0
      }
    });

    res.status(201).json(sticker);
  } catch (error) {
    console.error('Error adding sticker:', error);
    res.status(500).json({ error: 'Failed to add sticker' });
  }
};

// Удалить стикер
export const deleteSticker = async (req: Request, res: Response) => {
  try {
    const { stickerId } = req.params;

    await prisma.sticker.delete({
      where: { id: stickerId }
    });

    res.json({ message: 'Sticker deleted successfully' });
  } catch (error) {
    console.error('Error deleting sticker:', error);
    res.status(500).json({ error: 'Failed to delete sticker' });
  }
};

// Удалить пак стикеров
export const deleteStickerPack = async (req: Request, res: Response) => {
  try {
    const { packId } = req.params;
    const userId = req.user?.id;

    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId }
    });

    if (!pack) {
      return res.status(404).json({ error: 'Sticker pack not found' });
    }

    if (pack.creatorId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own sticker packs' });
    }

    await prisma.stickerPack.delete({
      where: { id: packId }
    });

    res.json({ message: 'Sticker pack deleted successfully' });
  } catch (error) {
    console.error('Error deleting sticker pack:', error);
    res.status(500).json({ error: 'Failed to delete sticker pack' });
  }
};
