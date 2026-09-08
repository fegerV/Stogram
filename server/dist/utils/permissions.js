"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResourceOwnership = exports.checkChatOwnership = exports.checkChatAdminPermission = exports.checkChatMembership = exports.assertCanManageChatMedia = exports.assertCanPinMessage = exports.assertCanSendMessage = exports.assertChatAdmin = exports.assertChatMember = exports.isChatAdminRole = exports.getChatMembership = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const permissionError = (message, statusCode = 403) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
const getChatMembership = async (chatId, userId) => {
    return prisma_1.default.chatMember.findFirst({
        where: { chatId, userId },
        select: {
            userId: true,
            chatId: true,
            role: true,
            chat: {
                select: {
                    id: true,
                    type: true,
                },
            },
        },
    });
};
exports.getChatMembership = getChatMembership;
const isChatAdminRole = (role) => role === 'OWNER' || role === 'ADMIN';
exports.isChatAdminRole = isChatAdminRole;
const assertChatMember = async (chatId, userId) => {
    const membership = await (0, exports.getChatMembership)(chatId, userId);
    if (!membership) {
        throw permissionError('Not a member of this chat');
    }
    return membership;
};
exports.assertChatMember = assertChatMember;
const assertChatAdmin = async (chatId, userId) => {
    const membership = await (0, exports.assertChatMember)(chatId, userId);
    if (!(0, exports.isChatAdminRole)(membership.role)) {
        throw permissionError('Only owners and admins can perform this action');
    }
    return membership;
};
exports.assertChatAdmin = assertChatAdmin;
const assertCanSendMessage = async (chatId, userId) => {
    const membership = await (0, exports.assertChatMember)(chatId, userId);
    if (membership.chat.type === 'CHANNEL' && !(0, exports.isChatAdminRole)(membership.role)) {
        throw permissionError('Only owners and admins can send messages to channels');
    }
    return membership;
};
exports.assertCanSendMessage = assertCanSendMessage;
exports.assertCanPinMessage = exports.assertChatAdmin;
exports.assertCanManageChatMedia = exports.assertChatAdmin;
const checkChatMembership = async (chatId, userId) => {
    return Boolean(await (0, exports.getChatMembership)(chatId, userId));
};
exports.checkChatMembership = checkChatMembership;
const checkChatAdminPermission = async (chatId, userId) => {
    const member = await (0, exports.getChatMembership)(chatId, userId);
    return Boolean(member && (0, exports.isChatAdminRole)(member.role));
};
exports.checkChatAdminPermission = checkChatAdminPermission;
const checkChatOwnership = async (chatId, userId) => {
    const member = await prisma_1.default.chatMember.findFirst({
        where: {
            chatId,
            userId,
            role: 'OWNER',
        },
    });
    return !!member;
};
exports.checkChatOwnership = checkChatOwnership;
const checkResourceOwnership = async (resourceId, userId, model) => {
    let resource;
    switch (model) {
        case 'message':
            resource = await prisma_1.default.message.findUnique({
                where: { id: resourceId },
                select: { senderId: true },
            });
            return resource?.senderId === userId;
        case 'bot':
            resource = await prisma_1.default.bot.findUnique({
                where: { id: resourceId },
                select: { ownerId: true },
            });
            return resource?.ownerId === userId;
        case 'webhook':
            resource = await prisma_1.default.webhook.findUnique({
                where: { id: resourceId },
                select: { bot: { select: { ownerId: true } } },
            });
            return resource?.bot?.ownerId === userId;
        default:
            return false;
    }
};
exports.checkResourceOwnership = checkResourceOwnership;
//# sourceMappingURL=permissions.js.map