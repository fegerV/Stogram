"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReactions = exports.removeReaction = exports.addReaction = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const index_1 = require("../index");
const zod_1 = require("zod");
const addReactionSchema = zod_1.z.object({
    emoji: zod_1.z.string().min(1).max(10),
});
/**
 * Add reaction to a message
 */
const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = addReactionSchema.parse(req.body);
        const userId = req.userId;
        // Check if message exists
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
            include: {
                chat: {
                    include: {
                        members: true,
                    },
                },
            },
        });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Check if user is a member of the chat
        const isMember = message.chat.members.some((m) => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Create or update reaction
        const reaction = await prisma_1.default.reaction.upsert({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji,
                },
            },
            create: {
                messageId,
                userId,
                emoji,
            },
            update: {},
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        // Emit to all chat members
        const memberIds = message.chat.members.map((m) => m.userId);
        memberIds.forEach((memberId) => {
            index_1.io.to(`user:${memberId}`).emit('reaction:add', {
                messageId,
                reaction,
            });
        });
        res.json(reaction);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Add reaction error:', error);
        res.status(500).json({ error: 'Failed to add reaction' });
    }
};
exports.addReaction = addReaction;
/**
 * Remove reaction from a message
 */
const removeReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.params;
        const userId = req.userId;
        // Check if reaction exists
        const reaction = await prisma_1.default.reaction.findUnique({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji: decodeURIComponent(emoji),
                },
            },
            include: {
                message: {
                    include: {
                        chat: {
                            include: {
                                members: true,
                            },
                        },
                    },
                },
            },
        });
        if (!reaction) {
            return res.status(404).json({ error: 'Reaction not found' });
        }
        // Delete reaction
        await prisma_1.default.reaction.delete({
            where: {
                id: reaction.id,
            },
        });
        // Emit to all chat members
        const memberIds = reaction.message.chat.members.map((m) => m.userId);
        memberIds.forEach((memberId) => {
            index_1.io.to(`user:${memberId}`).emit('reaction:remove', {
                messageId,
                userId,
                emoji: decodeURIComponent(emoji),
            });
        });
        res.json({ message: 'Reaction removed' });
    }
    catch (error) {
        console.error('Remove reaction error:', error);
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
};
exports.removeReaction = removeReaction;
/**
 * Get reactions for a message
 */
const getReactions = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
        // Получаем сообщение с информацией о чате
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
            include: {
                chat: {
                    include: {
                        members: true,
                    },
                },
            },
        });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Проверяем, является ли пользователь членом чата
        const isMember = message.chat.members.some((m) => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ error: 'Access denied. You must be a member of the chat to view reactions' });
        }
        const reactions = await prisma_1.default.reaction.findMany({
            where: { messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        // Group by emoji
        const grouped = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = [];
            }
            acc[reaction.emoji].push(reaction);
            return acc;
        }, {});
        res.json(grouped);
    }
    catch (error) {
        console.error('Get reactions error:', error);
        res.status(500).json({ error: 'Failed to fetch reactions' });
    }
};
exports.getReactions = getReactions;
//# sourceMappingURL=reactionController.js.map