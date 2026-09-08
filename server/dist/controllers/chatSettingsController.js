"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchivedChats = exports.unarchiveChat = exports.archiveChat = exports.resetUnreadCount = exports.updateUnreadCount = exports.toggleFavorite = exports.updateNotificationLevel = exports.unmuteChat = exports.muteChat = exports.updateChatSettings = exports.getChatSettings = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const updateNotificationSchema = zod_1.z.object({
    level: zod_1.z.enum(['ALL', 'MENTIONS', 'MUTED']),
});
const getChatSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        let settings = await prisma_1.default.chatSettings.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            include: {
                folder: true
            }
        });
        if (!settings) {
            settings = await prisma_1.default.chatSettings.create({
                data: {
                    userId,
                    chatId
                },
                include: {
                    folder: true
                }
            });
        }
        res.json({ settings });
    }
    catch (error) {
        console.error('Get chat settings error:', error);
        res.status(500).json({ error: 'Failed to get chat settings' });
    }
};
exports.getChatSettings = getChatSettings;
const updateChatSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { isMuted, isFavorite, folderId, notificationLevel } = req.body;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                isMuted: isMuted !== undefined ? isMuted : undefined,
                isFavorite: isFavorite !== undefined ? isFavorite : undefined,
                folderId: folderId !== undefined ? folderId : undefined,
                notificationLevel: notificationLevel !== undefined ? notificationLevel : undefined
            },
            create: {
                userId,
                chatId,
                isMuted: isMuted || false,
                isFavorite: isFavorite || false,
                folderId: folderId || null,
                notificationLevel: notificationLevel || 'ALL'
            },
            include: {
                folder: true
            }
        });
        res.json({ settings });
    }
    catch (error) {
        console.error('Update chat settings error:', error);
        res.status(500).json({ error: 'Failed to update chat settings' });
    }
};
exports.updateChatSettings = updateChatSettings;
const muteChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                isMuted: true,
                notificationLevel: 'MUTED'
            },
            create: {
                userId,
                chatId,
                isMuted: true,
                notificationLevel: 'MUTED'
            }
        });
        res.json({ settings, message: 'Chat muted successfully' });
    }
    catch (error) {
        console.error('Mute chat error:', error);
        res.status(500).json({ error: 'Failed to mute chat' });
    }
};
exports.muteChat = muteChat;
const unmuteChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                isMuted: false,
                notificationLevel: 'ALL'
            },
            create: {
                userId,
                chatId,
                isMuted: false,
                notificationLevel: 'ALL'
            }
        });
        res.json({ settings, message: 'Chat unmuted successfully' });
    }
    catch (error) {
        console.error('Unmute chat error:', error);
        res.status(500).json({ error: 'Failed to unmute chat' });
    }
};
exports.unmuteChat = unmuteChat;
const updateNotificationLevel = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { level } = updateNotificationSchema.parse(req.body);
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                notificationLevel: level,
                isMuted: level === 'MUTED'
            },
            create: {
                userId,
                chatId,
                notificationLevel: level,
                isMuted: level === 'MUTED'
            }
        });
        res.json({ settings, message: 'Notification level updated successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update notification level error:', error);
        res.status(500).json({ error: 'Failed to update notification level' });
    }
};
exports.updateNotificationLevel = updateNotificationLevel;
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const existingSettings = await prisma_1.default.chatSettings.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            }
        });
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                isFavorite: !existingSettings?.isFavorite
            },
            create: {
                userId,
                chatId,
                isFavorite: true
            }
        });
        res.json({ settings });
    }
    catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
};
exports.toggleFavorite = toggleFavorite;
const updateUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { count, lastReadMessageId } = req.body;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                unreadCount: count,
                lastReadMessageId: lastReadMessageId || undefined
            },
            create: {
                userId,
                chatId,
                unreadCount: count || 0,
                lastReadMessageId: lastReadMessageId || null
            }
        });
        res.json({ settings });
    }
    catch (error) {
        console.error('Update unread count error:', error);
        res.status(500).json({ error: 'Failed to update unread count' });
    }
};
exports.updateUnreadCount = updateUnreadCount;
const resetUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                unreadCount: 0
            },
            create: {
                userId,
                chatId,
                unreadCount: 0
            }
        });
        res.json({ settings });
    }
    catch (error) {
        console.error('Reset unread count error:', error);
        res.status(500).json({ error: 'Failed to reset unread count' });
    }
};
exports.resetUnreadCount = resetUnreadCount;
// Архивировать чат
const archiveChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                isArchived: true
            },
            create: {
                userId,
                chatId,
                isArchived: true
            }
        });
        res.json({ settings, message: 'Chat archived successfully' });
    }
    catch (error) {
        console.error('Archive chat error:', error);
        res.status(500).json({ error: 'Failed to archive chat' });
    }
};
exports.archiveChat = archiveChat;
// Разархивировать чат
const unarchiveChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const settings = await prisma_1.default.chatSettings.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            update: {
                isArchived: false
            },
            create: {
                userId,
                chatId,
                isArchived: false
            }
        });
        res.json({ settings, message: 'Chat unarchived successfully' });
    }
    catch (error) {
        console.error('Unarchive chat error:', error);
        res.status(500).json({ error: 'Failed to unarchive chat' });
    }
};
exports.unarchiveChat = unarchiveChat;
// Получить архивированные чаты
const getArchivedChats = async (req, res) => {
    try {
        const userId = req.userId;
        const archivedSettings = await prisma_1.default.chatSettings.findMany({
            where: {
                userId,
                isArchived: true
            },
            include: {
                chat: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        displayName: true,
                                        avatar: true,
                                        status: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const chats = archivedSettings.map((s) => s.chat);
        res.json({ chats });
    }
    catch (error) {
        console.error('Get archived chats error:', error);
        res.status(500).json({ error: 'Failed to get archived chats' });
    }
};
exports.getArchivedChats = getArchivedChats;
//# sourceMappingURL=chatSettingsController.js.map