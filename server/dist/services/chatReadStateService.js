"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markChatReadThroughMessage = exports.incrementUnreadForChatMembers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const countUnreadAfterMessage = async (chatId, userId, messageId) => {
    if (!messageId) {
        return prisma_1.default.message.count({
            where: {
                chatId,
                senderId: { not: userId },
                isDeleted: false,
            },
        });
    }
    const message = await prisma_1.default.message.findUnique({
        where: { id: messageId },
        select: { createdAt: true },
    });
    if (!message) {
        return 0;
    }
    return prisma_1.default.message.count({
        where: {
            chatId,
            senderId: { not: userId },
            isDeleted: false,
            createdAt: { gt: message.createdAt },
        },
    });
};
const incrementUnreadForChatMembers = async (chatId, senderId) => {
    const members = await prisma_1.default.chatMember.findMany({
        where: { chatId },
        select: { userId: true },
    });
    const recipients = members.filter((member) => member.userId !== senderId);
    const updates = [];
    for (const member of recipients) {
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId: member.userId,
                    chatId,
                },
            },
            update: {
                unreadCount: { increment: 1 },
            },
            create: {
                userId: member.userId,
                chatId,
                unreadCount: 1,
            },
        });
        updates.push({
            userId: member.userId,
            chatId,
            unreadCount: settings.unreadCount,
            lastReadMessageId: settings.lastReadMessageId,
        });
    }
    return updates;
};
exports.incrementUnreadForChatMembers = incrementUnreadForChatMembers;
const markChatReadThroughMessage = async (chatId, userId, messageId) => {
    const message = await prisma_1.default.message.findFirst({
        where: {
            id: messageId,
            chatId,
            chat: {
                members: {
                    some: { userId },
                },
            },
        },
        select: {
            id: true,
            createdAt: true,
        },
    });
    if (!message) {
        return null;
    }
    await prisma_1.default.messageRead.upsert({
        where: {
            messageId_userId: {
                messageId,
                userId,
            },
        },
        create: {
            messageId,
            userId,
        },
        update: {},
    });
    const existingSettings = await prisma_1.default.chatSettings.findUnique({
        where: {
            userId_chatId: {
                userId,
                chatId,
            },
        },
        select: {
            lastReadMessageId: true,
        },
    });
    if (existingSettings?.lastReadMessageId) {
        const lastRead = await prisma_1.default.message.findUnique({
            where: { id: existingSettings.lastReadMessageId },
            select: { createdAt: true },
        });
        if (lastRead && lastRead.createdAt >= message.createdAt) {
            const unreadCount = await countUnreadAfterMessage(chatId, userId, existingSettings.lastReadMessageId);
            return {
                userId,
                chatId,
                unreadCount,
                lastReadMessageId: existingSettings.lastReadMessageId,
            };
        }
    }
    const unreadCount = await countUnreadAfterMessage(chatId, userId, messageId);
    const settings = await prisma_1.default.chatSettings.upsert({
        where: {
            userId_chatId: {
                userId,
                chatId,
            },
        },
        update: {
            unreadCount,
            lastReadMessageId: messageId,
        },
        create: {
            userId,
            chatId,
            unreadCount,
            lastReadMessageId: messageId,
        },
    });
    return {
        userId,
        chatId,
        unreadCount: settings.unreadCount,
        lastReadMessageId: settings.lastReadMessageId,
    };
};
exports.markChatReadThroughMessage = markChatReadThroughMessage;
//# sourceMappingURL=chatReadStateService.js.map