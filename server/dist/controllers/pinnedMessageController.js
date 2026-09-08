"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPinnedMessages = exports.getPinnedMessages = exports.unpinMessage = exports.pinMessage = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const permissions_1 = require("../utils/permissions");
const pinMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId, chatId } = req.body;
        if (!messageId || !chatId) {
            return res.status(400).json({ error: 'Message ID and Chat ID are required' });
        }
        await (0, permissions_1.assertChatMember)(chatId, userId);
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId }
        });
        if (!message || message.chatId !== chatId) {
            return res.status(404).json({ error: 'Message not found' });
        }
        const existingPin = await prisma_1.default.pinnedMessage.findUnique({
            where: {
                userId_messageId_chatId: {
                    userId,
                    messageId,
                    chatId
                }
            }
        });
        if (existingPin) {
            return res.status(400).json({ error: 'Message already pinned' });
        }
        const pinnedMessage = await prisma_1.default.pinnedMessage.create({
            data: {
                userId,
                messageId,
                chatId
            },
            include: {
                message: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json({ pinnedMessage });
    }
    catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Pin message error:', error);
        res.status(500).json({ error: 'Failed to pin message' });
    }
};
exports.pinMessage = pinMessage;
const unpinMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId, chatId } = req.params;
        await (0, permissions_1.assertChatMember)(chatId, userId);
        const pinnedMessage = await prisma_1.default.pinnedMessage.findUnique({
            where: {
                userId_messageId_chatId: {
                    userId,
                    messageId,
                    chatId
                }
            }
        });
        if (!pinnedMessage) {
            return res.status(404).json({ error: 'Pinned message not found' });
        }
        await prisma_1.default.pinnedMessage.delete({
            where: {
                userId_messageId_chatId: {
                    userId,
                    messageId,
                    chatId
                }
            }
        });
        res.json({ message: 'Message unpinned successfully' });
    }
    catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Unpin message error:', error);
        res.status(500).json({ error: 'Failed to unpin message' });
    }
};
exports.unpinMessage = unpinMessage;
const getPinnedMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        await (0, permissions_1.assertChatMember)(chatId, userId);
        const pinnedMessages = await prisma_1.default.pinnedMessage.findMany({
            where: {
                userId,
                chatId
            },
            include: {
                message: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true
                            }
                        },
                        replyTo: {
                            select: {
                                id: true,
                                content: true,
                                sender: {
                                    select: {
                                        username: true,
                                        displayName: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { pinnedAt: 'desc' }
        });
        res.json({ pinnedMessages });
    }
    catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Get pinned messages error:', error);
        res.status(500).json({ error: 'Failed to get pinned messages' });
    }
};
exports.getPinnedMessages = getPinnedMessages;
const getAllPinnedMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const pinnedMessages = await prisma_1.default.pinnedMessage.findMany({
            where: { userId },
            include: {
                message: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true
                            }
                        },
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
            orderBy: { pinnedAt: 'desc' }
        });
        res.json({ pinnedMessages });
    }
    catch (error) {
        console.error('Get all pinned messages error:', error);
        res.status(500).json({ error: 'Failed to get all pinned messages' });
    }
};
exports.getAllPinnedMessages = getAllPinnedMessages;
//# sourceMappingURL=pinnedMessageController.js.map