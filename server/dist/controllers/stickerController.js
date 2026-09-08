"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStickerPack = exports.deleteSticker = exports.addStickerToPack = exports.createStickerPack = exports.getStickerPack = exports.getStickerPacks = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Получить все публичные паки стикеров
const getStickerPacks = async (req, res) => {
    try {
        const packs = await prisma_1.default.stickerPack.findMany({
            where: { isPublic: true },
            include: {
                stickers: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(packs);
    }
    catch (error) {
        console.error('Error fetching sticker packs:', error);
        res.status(500).json({ error: 'Failed to fetch sticker packs' });
    }
};
exports.getStickerPacks = getStickerPacks;
// Получить конкретный пак стикеров
const getStickerPack = async (req, res) => {
    try {
        const { slug } = req.params;
        const pack = await prisma_1.default.stickerPack.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching sticker pack:', error);
        res.status(500).json({ error: 'Failed to fetch sticker pack' });
    }
};
exports.getStickerPack = getStickerPack;
// Создать новый пак стикеров
const createStickerPack = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { name, slug, description, thumbnail, isPublic } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }
        const pack = await prisma_1.default.stickerPack.create({
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
    }
    catch (error) {
        console.error('Error creating sticker pack:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Sticker pack with this slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create sticker pack' });
    }
};
exports.createStickerPack = createStickerPack;
// Добавить стикер в пак
const addStickerToPack = async (req, res) => {
    try {
        const { packId } = req.params;
        const { emoji, imageUrl, width, height, order } = req.body;
        if (!imageUrl || !width || !height) {
            return res.status(400).json({ error: 'ImageUrl, width, and height are required' });
        }
        const sticker = await prisma_1.default.sticker.create({
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
    }
    catch (error) {
        console.error('Error adding sticker:', error);
        res.status(500).json({ error: 'Failed to add sticker' });
    }
};
exports.addStickerToPack = addStickerToPack;
// Удалить стикер (только владелец пака может удалить стикер)
const deleteSticker = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { stickerId } = req.params;
        // Получаем стикер с информацией о паке
        const sticker = await prisma_1.default.sticker.findUnique({
            where: { id: stickerId },
            include: {
                pack: {
                    select: { creatorId: true }
                }
            }
        });
        if (!sticker) {
            return res.status(404).json({ error: 'Sticker not found' });
        }
        // Проверяем, является ли пользователь владельцем пака
        if (sticker.pack.creatorId !== userId) {
            return res.status(403).json({ error: 'You can only delete stickers from your own packs' });
        }
        await prisma_1.default.sticker.delete({
            where: { id: stickerId }
        });
        res.json({ message: 'Sticker deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting sticker:', error);
        res.status(500).json({ error: 'Failed to delete sticker' });
    }
};
exports.deleteSticker = deleteSticker;
// Удалить пак стикеров
const deleteStickerPack = async (req, res) => {
    try {
        const { packId } = req.params;
        const userId = req.userId;
        const pack = await prisma_1.default.stickerPack.findUnique({
            where: { id: packId }
        });
        if (!pack) {
            return res.status(404).json({ error: 'Sticker pack not found' });
        }
        if (pack.creatorId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own sticker packs' });
        }
        await prisma_1.default.stickerPack.delete({
            where: { id: packId }
        });
        res.json({ message: 'Sticker pack deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting sticker pack:', error);
        res.status(500).json({ error: 'Failed to delete sticker pack' });
    }
};
exports.deleteStickerPack = deleteStickerPack;
//# sourceMappingURL=stickerController.js.map