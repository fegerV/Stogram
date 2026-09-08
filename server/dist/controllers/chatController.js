"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpinMessage = exports.pinMessage = exports.removeMember = exports.addMember = exports.deleteChat = exports.updateChat = exports.getChatById = exports.getChats = exports.createChat = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const n8nService_1 = __importDefault(require("../services/n8nService"));
const permissions_1 = require("../utils/permissions");
const createChatSchema = zod_1.z.object({
    type: zod_1.z.enum(['PRIVATE', 'GROUP', 'CHANNEL']),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    memberIds: zod_1.z.array(zod_1.z.string()),
});
const pinMessageSchema = zod_1.z.object({
    messageId: zod_1.z.string(),
});
const createChat = async (req, res) => {
    try {
        const { type, name, description, memberIds } = createChatSchema.parse(req.body);
        const userId = req.userId;
        if (type === 'PRIVATE' && memberIds.length !== 1) {
            return res.status(400).json({ error: 'Private chat requires exactly one member' });
        }
        if (type === 'PRIVATE') {
            const existingChats = await prisma_1.default.chat.findMany({
                where: {
                    type: 'PRIVATE',
                    AND: [
                        { members: { some: { userId } } },
                        { members: { some: { userId: memberIds[0] } } },
                    ],
                },
                include: {
                    members: {
                        include: { user: true },
                    },
                },
            });
            const participantIds = new Set([userId, memberIds[0]]);
            const existingChat = existingChats.find((chat) => (chat.members.length === participantIds.size &&
                chat.members.every((member) => participantIds.has(member.userId))));
            if (existingChat) {
                return res.json(existingChat);
            }
        }
        const chat = await prisma_1.default.chat.create({
            data: {
                type,
                name,
                description,
                members: {
                    create: [
                        { userId, role: 'OWNER' },
                        ...memberIds.map((id) => ({ userId: id, role: 'MEMBER' })),
                    ],
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        // Send n8n webhook event (async, don't wait)
        n8nService_1.default.deliverWebhookEvent('new_chat', {
            chatId: chat.id,
            type: chat.type,
            name: chat.name,
            createdBy: userId,
            memberIds: [userId, ...memberIds],
            timestamp: chat.createdAt.toISOString(),
        }).catch(console.error);
        res.status(201).json(chat);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create chat error:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
};
exports.createChat = createChat;
const getChats = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;
        const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
        const normalizedOffset = Math.max(Number(offset) || 0, 0);
        // Verify user exists
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get total count for pagination
        const totalCount = await prisma_1.default.chat.count({
            where: {
                members: {
                    some: { userId },
                },
            },
        });
        // Get paginated chats with optimized query - use select instead of include for members
        // to avoid N+1, then fetch members separately
        const chats = await prisma_1.default.chat.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            select: {
                id: true,
                name: true,
                type: true,
                avatar: true,
                description: true,
                isSecret: true,
                pinnedMessageId: true,
                createdAt: true,
                updatedAt: true,
                members: {
                    select: {
                        id: true,
                        userId: true,
                        role: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true,
                                status: true,
                                lastSeen: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: normalizedLimit,
            skip: normalizedOffset,
        });
        // Fetch last message for each chat in a single query to avoid N+1
        const chatIds = chats.map(c => c.id);
        const lastMessages = await prisma_1.default.message.findMany({
            where: {
                chatId: { in: chatIds },
                isDeleted: false,
            },
            orderBy: { createdAt: 'desc' },
            distinct: ['chatId'],
            select: {
                id: true,
                chatId: true,
                content: true,
                type: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        // Create a map for quick lookup
        const lastMessageMap = new Map(lastMessages.map(m => [m.chatId, m]));
        // Fetch pinned messages if any
        const pinnedMessageIds = chats
            .map(c => c.pinnedMessageId)
            .filter((id) => id !== null);
        const pinnedMessages = pinnedMessageIds.length > 0
            ? await prisma_1.default.message.findMany({
                where: { id: { in: pinnedMessageIds } },
                select: {
                    id: true,
                    chatId: true,
                    content: true,
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatar: true,
                        },
                    },
                },
            })
            : [];
        const pinnedMessageMap = new Map(pinnedMessages.map(m => [m.id, m]));
        // Combine data
        const enrichedChats = chats.map(chat => ({
            ...chat,
            messages: lastMessageMap.has(chat.id) ? [lastMessageMap.get(chat.id)] : [],
            pinnedMessage: chat.pinnedMessageId && pinnedMessageMap.has(chat.pinnedMessageId)
                ? pinnedMessageMap.get(chat.pinnedMessageId)
                : null,
        }));
        res.json({
            chats: enrichedChats,
            pagination: {
                total: totalCount,
                limit: normalizedLimit,
                offset: normalizedOffset,
                hasMore: normalizedOffset + chats.length < totalCount,
            },
        });
    }
    catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            error: 'Failed to fetch chats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getChats = getChats;
const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const chat = await prisma_1.default.chat.findFirst({
            where: {
                id: chatId,
                members: {
                    some: { userId },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true,
                                status: true,
                                lastSeen: true,
                            },
                        },
                    },
                },
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
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    }
    catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
};
exports.getChatById = getChatById;
const updateChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const { name, description, avatar } = req.body;
        if (!(await (0, permissions_1.checkChatAdminPermission)(chatId, userId))) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        const chat = await prisma_1.default.chat.update({
            where: { id: chatId },
            data: { name, description, avatar },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(chat);
    }
    catch (error) {
        console.error('Update chat error:', error);
        res.status(500).json({ error: 'Failed to update chat' });
    }
};
exports.updateChat = updateChat;
const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        if (!(await (0, permissions_1.checkChatOwnership)(chatId, userId))) {
            return res.status(403).json({ error: 'Only owner can delete chat' });
        }
        await prisma_1.default.chat.delete({
            where: { id: chatId },
        });
        res.json({ message: 'Chat deleted successfully' });
    }
    catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
};
exports.deleteChat = deleteChat;
const addMember = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId: newUserId } = req.body;
        const userId = req.userId;
        if (!(await (0, permissions_1.checkChatAdminPermission)(chatId, userId))) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        const newMember = await prisma_1.default.chatMember.create({
            data: {
                chatId,
                userId: newUserId,
                role: 'MEMBER',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        status: true,
                    },
                },
            },
        });
        res.status(201).json(newMember);
    }
    catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
};
exports.addMember = addMember;
const removeMember = async (req, res) => {
    try {
        const { chatId, memberId } = req.params;
        const userId = req.userId;
        if (!(await (0, permissions_1.checkChatAdminPermission)(chatId, userId))) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        await prisma_1.default.chatMember.delete({
            where: {
                id: memberId,
            },
        });
        res.json({ message: 'Member removed successfully' });
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};
exports.removeMember = removeMember;
const pinMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { messageId } = pinMessageSchema.parse(req.body);
        try {
            await (0, permissions_1.assertCanPinMessage)(chatId, userId);
        }
        catch {
            return res.status(403).json({ error: 'Only owners and admins can pin messages' });
        }
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.chatId !== chatId) {
            return res.status(404).json({ error: 'Message not found' });
        }
        const chat = await prisma_1.default.chat.update({
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
                members: {
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
                },
            },
        });
        res.json({ chat, message: 'Message pinned successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Pin message error:', error);
        res.status(500).json({ error: 'Failed to pin message' });
    }
};
exports.pinMessage = pinMessage;
const unpinMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        try {
            await (0, permissions_1.assertCanPinMessage)(chatId, userId);
        }
        catch {
            return res.status(403).json({ error: 'Only owners and admins can unpin messages' });
        }
        const chat = await prisma_1.default.chat.update({
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
                members: {
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
                },
            },
        });
        res.json({ chat, message: 'Message unpinned successfully' });
    }
    catch (error) {
        console.error('Unpin message error:', error);
        res.status(500).json({ error: 'Failed to unpin message' });
    }
};
exports.unpinMessage = unpinMessage;
//# sourceMappingURL=chatController.js.map