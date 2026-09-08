"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.editMessage = exports.markAsRead = exports.forwardMessage = exports.sendMessage = exports.getMessages = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const errorHandlers_1 = require("../utils/errorHandlers");
const permissions_1 = require("../utils/permissions");
const userSelect_1 = require("../utils/userSelect");
const index_1 = require("../index");
const n8nService_1 = __importDefault(require("../services/n8nService"));
const internalBotRuntimeService_1 = __importDefault(require("../services/internalBotRuntimeService"));
const messageLifecycleService_1 = require("../services/messageLifecycleService");
const chatReadStateService_1 = require("../services/chatReadStateService");
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().optional(),
    type: zod_1.z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE', 'GIF']).default('TEXT'),
    replyToId: zod_1.z.string().optional(),
    scheduledFor: zod_1.z.string().optional(),
    expiresIn: zod_1.z.preprocess((value) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return Number(value);
    }, zod_1.z.number().int().positive().optional()),
    isSilent: zod_1.z.preprocess((value) => value === true || value === 'true', zod_1.z.boolean().optional()),
    clientMessageId: zod_1.z.string().max(128).optional(),
});
const forwardMessageSchema = zod_1.z.object({
    chatIds: zod_1.z.array(zod_1.z.string()).min(1),
});
const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const { limit = 50, before } = req.query;
        const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
        const isMember = await (0, permissions_1.checkChatMembership)(chatId, userId);
        if (!isMember) {
            return (0, errorHandlers_1.handleForbidden)(res, 'Not a member of this chat');
        }
        const where = {
            chatId,
            isDeleted: false,
        };
        if (before) {
            where.createdAt = { lt: new Date(before) };
        }
        const messages = await prisma_1.default.message.findMany({
            where,
            take: normalizedLimit,
            orderBy: { createdAt: 'desc' },
            include: {
                bot: true,
                sender: {
                    select: userSelect_1.basicUserSelect,
                },
                replyTo: {
                    include: {
                        bot: true,
                        sender: {
                            select: userSelect_1.basicUserSelect,
                        },
                    },
                },
                reads: {
                    select: {
                        userId: true,
                        readAt: true,
                    },
                },
            },
        });
        // Mark messages as read (batch)
        const messageIds = messages.map((m) => m.id);
        if (messageIds.length > 0) {
            const existingReads = await prisma_1.default.messageRead.findMany({
                where: {
                    messageId: { in: messageIds },
                    userId,
                },
                select: { messageId: true },
            });
            const existingMessageIds = new Set(existingReads.map((r) => r.messageId));
            const newReads = messageIds
                .filter((id) => !existingMessageIds.has(id))
                .map((messageId) => ({
                messageId,
                userId,
            }));
            if (newReads.length > 0) {
                await prisma_1.default.messageRead.createMany({
                    data: newReads,
                    skipDuplicates: true,
                });
                // Emit read receipts
                newReads.forEach(({ messageId }) => {
                    index_1.io.to(`chat:${chatId}`).emit('message:read', { messageId, userId });
                });
            }
            const latestFetchedMessage = messages[0];
            const unreadUpdate = await (0, chatReadStateService_1.markChatReadThroughMessage)(chatId, userId, latestFetchedMessage.id);
            if (unreadUpdate) {
                index_1.io.to(`user:${userId}`).emit('chat:unread-updated', unreadUpdate);
            }
        }
        res.json(messages.reverse());
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to fetch messages');
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const data = sendMessageSchema.parse(req.body);
        const { message, isDuplicate, links, unreadUpdates } = await (0, messageLifecycleService_1.sendChatMessage)({
            chatId,
            senderId: userId,
            content: data.content,
            type: data.type,
            replyToId: data.replyToId,
            scheduledFor: data.scheduledFor,
            expiresIn: data.expiresIn,
            isSilent: data.isSilent,
            clientMessageId: data.clientMessageId,
            file: req.file,
        });
        if (!isDuplicate) {
            index_1.io.to(`chat:${chatId}`).emit('message:new', message);
            unreadUpdates.forEach((update) => {
                index_1.io.to(`user:${update.userId}`).emit('chat:unread-updated', update);
            });
            n8nService_1.default.deliverWebhookEvent('new_message', {
                messageId: message.id,
                chatId,
                senderId: userId,
                content: data.content,
                type: message.type,
                timestamp: message.createdAt.toISOString(),
            }).catch(console.error);
            internalBotRuntimeService_1.default.dispatchChatMessageEvent(message.id, 'message.created').catch(console.error);
        }
        if (links.length > 0) {
            (0, messageLifecycleService_1.attachLinkPreview)(message.id, chatId, links[0], (updatedMessage) => {
                index_1.io.to(`chat:${chatId}`).emit('message:update', updatedMessage);
            })
                .catch(console.error);
        }
        res.status(isDuplicate ? 200 : 201).json(message);
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to send message');
    }
};
exports.sendMessage = sendMessage;
const forwardMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
        const { chatIds } = forwardMessageSchema.parse(req.body);
        // Get original message
        const originalMessage = await prisma_1.default.message.findUnique({
            where: { id: messageId },
            include: {
                bot: true,
                sender: {
                    select: userSelect_1.basicUserSelect,
                },
                chat: {
                    include: {
                        members: true,
                    },
                },
            },
        });
        if (!originalMessage) {
            return (0, errorHandlers_1.handleNotFound)(res, 'Message');
        }
        // Check if user has access to original message
        const hasAccess = originalMessage.chat.members.some((m) => m.userId === userId);
        if (!hasAccess) {
            return (0, errorHandlers_1.handleForbidden)(res, 'Access denied to original message');
        }
        // Verify user can send to all target chats, including channel role rules.
        for (const targetChatId of chatIds) {
            await (0, permissions_1.assertCanSendMessage)(targetChatId, userId);
        }
        // Forward message to all target chats
        const forwardedMessages = [];
        for (const targetChatId of chatIds) {
            const forwardedMessage = await prisma_1.default.message.create({
                data: {
                    content: originalMessage.content,
                    type: originalMessage.type,
                    senderId: userId,
                    chatId: targetChatId,
                    fileUrl: originalMessage.fileUrl,
                    fileName: originalMessage.fileName,
                    fileSize: originalMessage.fileSize,
                    thumbnailUrl: originalMessage.thumbnailUrl,
                    duration: originalMessage.duration,
                    waveform: originalMessage.waveform,
                    isForwarded: true,
                    forwardedFromId: originalMessage.id,
                    forwardedFromChatId: originalMessage.chatId,
                    forwardedFromUserId: originalMessage.senderId,
                    isSent: true,
                },
                include: {
                    bot: true,
                    sender: {
                        select: userSelect_1.basicUserSelect,
                    },
                },
            });
            await prisma_1.default.chat.update({
                where: { id: targetChatId },
                data: { updatedAt: new Date() },
            });
            // Emit to chat participants
            index_1.io.to(`chat:${targetChatId}`).emit('message:new', forwardedMessage);
            const unreadUpdates = await (0, chatReadStateService_1.incrementUnreadForChatMembers)(targetChatId, userId);
            unreadUpdates.forEach((update) => {
                index_1.io.to(`user:${update.userId}`).emit('chat:unread-updated', update);
            });
            forwardedMessages.push(forwardedMessage);
        }
        res.json({ messages: forwardedMessages });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to forward message');
    }
};
exports.forwardMessage = forwardMessage;
const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
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
            return (0, errorHandlers_1.handleNotFound)(res, 'Message');
        }
        // Check if user is member of the chat
        const isMember = message.chat.members.some((m) => m.userId === userId);
        if (!isMember) {
            return (0, errorHandlers_1.handleForbidden)(res, 'Not a member of this chat');
        }
        const unreadUpdate = await (0, chatReadStateService_1.markChatReadThroughMessage)(message.chatId, userId, messageId);
        index_1.io.to(`chat:${message.chatId}`).emit('message:read', { messageId, userId });
        if (unreadUpdate) {
            index_1.io.to(`user:${userId}`).emit('chat:unread-updated', unreadUpdate);
        }
        res.json({ success: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to mark message as read');
    }
};
exports.markAsRead = markAsRead;
const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
        const { content } = req.body;
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            return (0, errorHandlers_1.handleNotFound)(res, 'Message');
        }
        if (message.senderId !== userId) {
            return (0, errorHandlers_1.handleForbidden)(res);
        }
        const updatedMessage = await prisma_1.default.message.update({
            where: { id: messageId },
            data: { content, isEdited: true },
            include: {
                bot: true,
                sender: {
                    select: userSelect_1.basicUserSelect,
                },
            },
        });
        // Emit update
        index_1.io.to(`chat:${message.chatId}`).emit('message:update', updatedMessage);
        // Send n8n webhook event (async, don't wait)
        n8nService_1.default.deliverWebhookEvent('message_updated', {
            messageId,
            chatId: message.chatId,
            userId,
            newContent: content,
            timestamp: new Date().toISOString(),
        }).catch(console.error);
        internalBotRuntimeService_1.default.dispatchChatMessageEvent(messageId, 'message.updated').catch(console.error);
        res.json(updatedMessage);
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to edit message');
    }
};
exports.editMessage = editMessage;
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            return (0, errorHandlers_1.handleNotFound)(res, 'Message');
        }
        if (message.senderId !== userId) {
            return (0, errorHandlers_1.handleForbidden)(res);
        }
        await prisma_1.default.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: 'Message deleted' },
        });
        // Emit deletion
        index_1.io.to(`chat:${message.chatId}`).emit('message:delete', { messageId });
        // Send n8n webhook event (async, don't wait)
        n8nService_1.default.deliverWebhookEvent('message_deleted', {
            messageId,
            chatId: message.chatId,
            userId,
            timestamp: new Date().toISOString(),
        }).catch(console.error);
        internalBotRuntimeService_1.default.dispatchChatMessageEvent(messageId, 'message.deleted').catch(console.error);
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to delete message');
    }
};
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=messageController.js.map