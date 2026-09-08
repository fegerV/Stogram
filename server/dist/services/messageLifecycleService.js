"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachLinkPreview = exports.sendChatMessage = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const mediaService_1 = require("./mediaService");
const pushService_1 = require("./pushService");
const permissions_1 = require("../utils/permissions");
const textParsers_1 = require("../utils/textParsers");
const linkPreview_1 = require("../utils/linkPreview");
const userSelect_1 = require("../utils/userSelect");
const chatReadStateService_1 = require("./chatReadStateService");
const includeMessageRelations = {
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
};
const resolveUploadedMedia = async (file, requestedType) => {
    let fileUrl = `/uploads/${file.filename}`;
    let messageType = requestedType || 'FILE';
    const fileName = file.originalname;
    const fileSize = file.size;
    let thumbnailUrl;
    let duration;
    let waveform;
    if (!requestedType || requestedType === 'FILE') {
        if (file.mimetype.startsWith('image/')) {
            messageType = 'IMAGE';
        }
        else if (file.mimetype.startsWith('video/')) {
            messageType = 'VIDEO';
        }
        else if (file.mimetype.startsWith('audio/')) {
            messageType = 'AUDIO';
        }
    }
    try {
        const mediaResult = await (0, mediaService_1.processMedia)(file.path, file.mimetype);
        if (mediaResult.compressedPath && mediaResult.compressedPath !== mediaResult.originalPath) {
            fileUrl = mediaResult.compressedPath.replace(/^.*\/uploads/, '/uploads');
        }
        if (mediaResult.thumbnailPath) {
            thumbnailUrl = mediaResult.thumbnailPath.replace(/^.*\/uploads/, '/uploads');
        }
        if (mediaResult.duration) {
            duration = mediaResult.duration;
        }
        if (mediaResult.waveform) {
            waveform = mediaResult.waveform;
        }
    }
    catch (error) {
        console.error('Media processing error:', error);
    }
    return {
        fileUrl,
        fileName,
        fileSize,
        thumbnailUrl,
        duration,
        waveform,
        messageType,
    };
};
const sendChatMessage = async (input) => {
    await (0, permissions_1.assertCanSendMessage)(input.chatId, input.senderId);
    if (input.clientMessageId) {
        const existingMessage = await prisma_1.default.message.findFirst({
            where: {
                senderId: input.senderId,
                clientMessageId: input.clientMessageId,
            },
            include: includeMessageRelations,
        });
        if (existingMessage) {
            return {
                message: existingMessage,
                isDuplicate: true,
                links: [],
                unreadUpdates: [],
            };
        }
    }
    const media = input.file
        ? await resolveUploadedMedia(input.file, input.type)
        : {
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            thumbnailUrl: undefined,
            duration: undefined,
            waveform: undefined,
            messageType: input.type || 'TEXT',
        };
    const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : undefined;
    const isSent = !scheduledFor;
    const expiresAt = input.expiresIn ? new Date(Date.now() + input.expiresIn * 1000) : undefined;
    const links = input.content ? (0, textParsers_1.extractUrls)(input.content) : [];
    const message = await prisma_1.default.message.create({
        data: {
            clientMessageId: input.clientMessageId,
            content: input.content,
            type: media.messageType,
            senderId: input.senderId,
            chatId: input.chatId,
            replyToId: input.replyToId,
            fileUrl: media.fileUrl,
            fileName: media.fileName,
            fileSize: media.fileSize,
            thumbnailUrl: media.thumbnailUrl,
            duration: media.duration,
            waveform: media.waveform,
            scheduledFor,
            expiresAt,
            isSent,
            isSilent: input.isSilent || false,
            mentions: input.content ? JSON.stringify((0, textParsers_1.extractMentions)(input.content)) : null,
            hashtags: input.content ? JSON.stringify((0, textParsers_1.extractHashtags)(input.content)) : null,
            linkPreview: undefined,
        },
        include: includeMessageRelations,
    });
    await prisma_1.default.chat.update({
        where: { id: input.chatId },
        data: { updatedAt: new Date() },
    });
    if (isSent && !input.isSilent) {
        const chat = await prisma_1.default.chat.findUnique({
            where: { id: input.chatId },
            include: { members: true },
        });
        const sender = await prisma_1.default.user.findUnique({
            where: { id: input.senderId },
            select: { displayName: true, username: true },
        });
        if (chat && sender) {
            const senderName = sender.displayName || sender.username;
            chat.members
                .filter((member) => member.userId !== input.senderId)
                .forEach((member) => {
                (0, pushService_1.sendNewMessageNotification)(member.userId, senderName, input.content || 'Sent a file', input.chatId).catch(console.error);
            });
        }
    }
    const unreadUpdates = isSent
        ? await (0, chatReadStateService_1.incrementUnreadForChatMembers)(input.chatId, input.senderId)
        : [];
    return {
        message,
        isDuplicate: false,
        links,
        unreadUpdates,
    };
};
exports.sendChatMessage = sendChatMessage;
const attachLinkPreview = async (messageId, chatId, url, onUpdated) => {
    const preview = await (0, linkPreview_1.fetchLinkPreview)(url);
    if (!preview) {
        return;
    }
    const updatedMessage = await prisma_1.default.message.update({
        where: { id: messageId },
        data: { linkPreview: JSON.parse(JSON.stringify(preview)) },
        include: includeMessageRelations,
    });
    onUpdated(updatedMessage);
};
exports.attachLinkPreview = attachLinkPreview;
//# sourceMappingURL=messageLifecycleService.js.map