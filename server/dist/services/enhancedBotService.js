"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeChatInviteLink = exports.createChatInviteLink = exports.exportChatInviteLink = exports.promoteChatMember = exports.restrictChatMember = exports.unbanChatMember = exports.kickChatMember = exports.setChatPermissions = exports.getChatMember = exports.getChatMemberCount = exports.getChatAdministrators = exports.deleteMessage = exports.editMessageReplyMarkup = exports.editMessageText = exports.answerInlineQuery = exports.answerCallbackQuery = exports.sendChatAction = exports.buildReplyKeyboard = exports.buildInlineKeyboard = exports.parseMessageEntities = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const index_1 = require("../index");
const internalBotRuntimeService_1 = __importDefault(require("./internalBotRuntimeService"));
const parseMessageEntities = (text) => {
    const entities = [];
    // Parse mentions (@username)
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        entities.push({
            type: 'mention',
            offset: match.index,
            length: match[0].length,
        });
    }
    // Parse hashtags (#tag)
    const hashtagRegex = /#(\w+)/g;
    while ((match = hashtagRegex.exec(text)) !== null) {
        entities.push({
            type: 'hashtag',
            offset: match.index,
            length: match[0].length,
        });
    }
    // Parse commands (/command)
    const commandRegex = /(\/[\w@]+)/g;
    while ((match = commandRegex.exec(text)) !== null) {
        entities.push({
            type: 'bot_command',
            offset: match.index,
            length: match[0].length,
        });
    }
    // Parse URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    while ((match = urlRegex.exec(text)) !== null) {
        entities.push({
            type: 'url',
            offset: match.index,
            length: match[0].length,
        });
    }
    return entities;
};
exports.parseMessageEntities = parseMessageEntities;
const buildInlineKeyboard = (rows) => ({
    inline_keyboard: rows,
});
exports.buildInlineKeyboard = buildInlineKeyboard;
const buildReplyKeyboard = (rows, options) => ({
    keyboard: rows.map(row => row.map(text => ({ text }))),
    resize_keyboard: options?.resize,
    one_time_keyboard: options?.oneTime,
});
exports.buildReplyKeyboard = buildReplyKeyboard;
const sendChatAction = async (botId, chatId, action) => {
    const bot = await prisma_1.default.bot.findUnique({
        where: { id: botId },
        select: { isActive: true, ownerId: true },
    });
    if (!bot?.isActive)
        return false;
    // Emit chat action to WebSocket clients
    index_1.io.to(`chat:${chatId}`).emit('chat:action', {
        botId,
        chatId,
        action, // 'typing', 'upload_photo', 'record_video', 'record_audio', 'upload_document', 'find_location', 'record_video_note', 'choose_sticker'
        timestamp: new Date().toISOString(),
    });
    return true;
};
exports.sendChatAction = sendChatAction;
const answerCallbackQuery = async (botId, callbackQueryId, options) => {
    const installation = await prisma_1.default.botChatInstallation.findFirst({
        where: { botId, isActive: true },
        include: { chat: true },
    });
    if (!installation)
        return false;
    // Store callback answer for client polling
    await prisma_1.default.botCallbackAnswer.create({
        data: {
            botId,
            callbackQueryId,
            text: options?.text,
            showAlert: options?.show_alert ?? false,
            url: options?.url,
            cacheTime: options?.cache_time ?? 0,
        },
    });
    // Emit to WebSocket
    index_1.io.to(`chat:${installation.chatId}`).emit('bot:callback_answer', {
        callbackQueryId,
        text: options?.text,
        showAlert: options?.show_alert,
        url: options?.url,
    });
    return true;
};
exports.answerCallbackQuery = answerCallbackQuery;
const answerInlineQuery = async (botId, inlineQueryId, results, options) => {
    const bot = await prisma_1.default.bot.findUnique({
        where: { id: botId },
        select: { isActive: true, isInline: true },
    });
    if (!bot?.isActive || !bot.isInline)
        return false;
    // Store inline query results
    await prisma_1.default.botInlineResult.create({
        data: {
            botId,
            inlineQueryId,
            results: results,
            cacheTime: options?.cache_time ?? 300,
            isPersonal: options?.is_personal ?? false,
            nextOffset: options?.next_offset,
            button: options?.button,
        },
    });
    // Emit to WebSocket for real-time delivery
    index_1.io.emit('bot:inline_results', {
        inlineQueryId,
        results,
        cacheTime: options?.cache_time,
        isPersonal: options?.is_personal,
        nextOffset: options?.next_offset,
        button: options?.button,
    });
    return true;
};
exports.answerInlineQuery = answerInlineQuery;
const editMessageText = async (botId, messageId, newText, options) => {
    const message = await prisma_1.default.message.findUnique({
        where: { id: messageId },
        include: { chat: true },
    });
    if (!message || message.botId !== botId)
        return false;
    const updated = await prisma_1.default.message.update({
        where: { id: messageId },
        data: {
            content: newText,
            linkPreview: options?.parse_mode ? { mode: options.parse_mode } : undefined,
        },
    });
    index_1.io.to(`chat:${message.chatId}`).emit('message:edited', {
        messageId,
        content: newText,
        editedAt: updated.updatedAt.toISOString(),
    });
    return true;
};
exports.editMessageText = editMessageText;
const editMessageReplyMarkup = async (botId, messageId, replyMarkup) => {
    const message = await prisma_1.default.message.findUnique({
        where: { id: messageId },
        include: { chat: true },
    });
    if (!message || message.botId !== botId)
        return false;
    await prisma_1.default.message.update({
        where: { id: messageId },
        data: {
            linkPreview: { ...message.linkPreview, keyboard: replyMarkup },
        },
    });
    index_1.io.to(`chat:${message.chatId}`).emit('message:markup_edited', {
        messageId,
        replyMarkup,
    });
    return true;
};
exports.editMessageReplyMarkup = editMessageReplyMarkup;
const deleteMessage = async (botId, messageId) => {
    const message = await prisma_1.default.message.findUnique({
        where: { id: messageId },
        include: { chat: true },
    });
    if (!message || message.botId !== botId)
        return false;
    await prisma_1.default.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
    });
    index_1.io.to(`chat:${message.chatId}`).emit('message:deleted', {
        messageId,
        deletedAt: new Date().toISOString(),
    });
    // Trigger bot runtime event
    await internalBotRuntimeService_1.default.dispatchChatMessageEvent(messageId, 'message.deleted');
    return true;
};
exports.deleteMessage = deleteMessage;
const getChatAdministrators = async (chatId) => {
    const members = await prisma_1.default.chatMember.findMany({
        where: {
            chatId,
            role: { in: ['ADMIN', 'OWNER'] },
        },
        select: {
            userId: true,
            role: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                },
            },
        },
    });
    return members.map(m => ({
        userId: m.userId,
        role: m.role,
    }));
};
exports.getChatAdministrators = getChatAdministrators;
const getChatMemberCount = async (chatId) => {
    return prisma_1.default.chatMember.count({
        where: { chatId },
    });
};
exports.getChatMemberCount = getChatMemberCount;
const getChatMember = async (chatId, userId) => {
    return prisma_1.default.chatMember.findUnique({
        where: {
            chatId_userId: {
                chatId,
                userId,
            },
        },
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
};
exports.getChatMember = getChatMember;
const setChatPermissions = async (chatId, permissions) => {
    await prisma_1.default.chat.update({
        where: { id: chatId },
        data: {
            permissions: permissions,
        },
    });
    index_1.io.to(`chat:${chatId}`).emit('chat:permissions_updated', {
        chatId,
        permissions,
    });
    return true;
};
exports.setChatPermissions = setChatPermissions;
const kickChatMember = async (chatId, userId, untilDate) => {
    const membership = await prisma_1.default.chatMember.findUnique({
        where: {
            chatId_userId: {
                chatId,
                userId,
            },
        },
    });
    if (!membership)
        return false;
    if (untilDate) {
        // Temporary ban - mute until date
        await prisma_1.default.chatMember.update({
            where: { id: membership.id },
            data: {
                mutedUntil: untilDate,
            },
        });
    }
    else {
        // Permanent ban - remove member
        await prisma_1.default.chatMember.delete({
            where: { id: membership.id },
        });
    }
    index_1.io.to(`chat:${chatId}`).emit('chat:member_kicked', {
        chatId,
        userId,
        untilDate: untilDate?.toISOString(),
    });
    return true;
};
exports.kickChatMember = kickChatMember;
const unbanChatMember = async (chatId, userId) => {
    const membership = await prisma_1.default.chatMember.findFirst({
        where: {
            chatId,
            userId,
            mutedUntil: { not: null },
        },
    });
    if (!membership)
        return false;
    await prisma_1.default.chatMember.update({
        where: { id: membership.id },
        data: {
            mutedUntil: null,
        },
    });
    index_1.io.to(`chat:${chatId}`).emit('chat:member_unbanned', {
        chatId,
        userId,
    });
    return true;
};
exports.unbanChatMember = unbanChatMember;
const restrictChatMember = async (chatId, userId, permissions) => {
    await prisma_1.default.chatMember.updateMany({
        where: {
            chatId,
            userId,
        },
        data: {
            permissions: permissions,
        },
    });
    index_1.io.to(`chat:${chatId}`).emit('chat:member_restricted', {
        chatId,
        userId,
        permissions,
    });
    return true;
};
exports.restrictChatMember = restrictChatMember;
const promoteChatMember = async (chatId, userId, options) => {
    await prisma_1.default.chatMember.updateMany({
        where: {
            chatId,
            userId,
        },
        data: {
            role: 'ADMIN',
            adminPermissions: options,
        },
    });
    index_1.io.to(`chat:${chatId}`).emit('chat:member_promoted', {
        chatId,
        userId,
        permissions: options,
    });
    return true;
};
exports.promoteChatMember = promoteChatMember;
const exportChatInviteLink = async (chatId) => {
    const chat = await prisma_1.default.chat.findUnique({
        where: { id: chatId },
    });
    if (!chat)
        throw new Error('Chat not found');
    // Generate unique invite link
    const inviteCode = `invite_${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await prisma_1.default.chatInviteLink.create({
        data: {
            chatId,
            inviteCode,
            name: 'Generated link',
            expiresAt: null,
            maxUses: null,
            createdBy: 'system', // Should be actual user ID in real implementation
        },
    });
    return `${process.env.APP_URL || 'https://stogram.app'}/join/${inviteCode}`;
};
exports.exportChatInviteLink = exportChatInviteLink;
const createChatInviteLink = async (chatId, options) => {
    const chat = await prisma_1.default.chat.findUnique({
        where: { id: chatId },
    });
    if (!chat)
        throw new Error('Chat not found');
    const inviteCode = `invite_${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const link = await prisma_1.default.chatInviteLink.create({
        data: {
            chatId,
            inviteCode,
            name: options.name || 'Invite link',
            expiresAt: options.expireDate,
            maxUses: options.memberLimit,
            createsJoinRequest: options.creates_join_request ?? false,
            createdBy: 'system',
        },
    });
    return {
        inviteLink: `${process.env.APP_URL || 'https://stogram.app'}/join/${inviteCode}`,
        inviteCode,
    };
};
exports.createChatInviteLink = createChatInviteLink;
const revokeChatInviteLink = async (chatId, inviteCode) => {
    await prisma_1.default.chatInviteLink.updateMany({
        where: {
            chatId,
            inviteCode,
        },
        data: {
            revokedAt: new Date(),
        },
    });
    index_1.io.to(`chat:${chatId}`).emit('chat:invite_link_revoked', {
        chatId,
        inviteCode,
    });
    return true;
};
exports.revokeChatInviteLink = revokeChatInviteLink;
//# sourceMappingURL=enhancedBotService.js.map