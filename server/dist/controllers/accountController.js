"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importData = exports.exportData = exports.clearCache = exports.getStorageInfo = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const getStorageInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const [messageCount, mediaMessages, contacts, chats, cacheEntries,] = await Promise.all([
            prisma_1.default.message.count({
                where: { senderId: userId },
            }),
            prisma_1.default.message.findMany({
                where: {
                    senderId: userId,
                    fileSize: { not: null },
                },
                select: { fileSize: true },
            }),
            prisma_1.default.contact.count({
                where: { userId },
            }),
            prisma_1.default.chatMember.count({
                where: { userId },
            }),
            prisma_1.default.messageCache.count(),
        ]);
        const totalMediaBytes = mediaMessages.reduce((sum, msg) => sum + (msg.fileSize || 0), 0);
        const estimatedMessageBytes = messageCount * 500;
        const estimatedContactBytes = contacts * 200;
        const estimatedChatBytes = chats * 1000;
        const estimatedCacheBytes = cacheEntries * 5000;
        const totalEstimatedBytes = totalMediaBytes +
            estimatedMessageBytes +
            estimatedContactBytes +
            estimatedChatBytes +
            estimatedCacheBytes;
        res.json({
            messages: {
                count: messageCount,
                estimatedBytes: estimatedMessageBytes,
            },
            media: {
                count: mediaMessages.length,
                totalBytes: totalMediaBytes,
            },
            contacts: {
                count: contacts,
                estimatedBytes: estimatedContactBytes,
            },
            chats: {
                count: chats,
                estimatedBytes: estimatedChatBytes,
            },
            cache: {
                entriesCount: cacheEntries,
                estimatedBytes: estimatedCacheBytes,
            },
            total: {
                estimatedBytes: totalEstimatedBytes,
                formatted: formatBytes(totalEstimatedBytes),
            },
        });
    }
    catch (error) {
        console.error('Get storage info error:', error);
        res.status(500).json({ error: 'Failed to fetch storage information' });
    }
};
exports.getStorageInfo = getStorageInfo;
const clearCache = async (req, res) => {
    try {
        const userId = req.userId;
        const userChats = await prisma_1.default.chatMember.findMany({
            where: { userId },
            select: { chatId: true },
        });
        const chatIds = userChats.map((cm) => cm.chatId);
        await prisma_1.default.messageCache.deleteMany({
            where: {
                chatId: { in: chatIds },
            },
        });
        const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || './uploads');
        const tempDir = path.join(uploadsDir, 'temp', userId);
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch (error) {
            console.warn('No temp directory to clean:', tempDir);
        }
        res.json({
            message: 'Cache cleared successfully',
            cleared: {
                messageCacheEntries: chatIds.length,
                tempFiles: true,
            },
        });
    }
    catch (error) {
        console.error('Clear cache error:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
};
exports.clearCache = clearCache;
const exportData = async (req, res) => {
    try {
        const userId = req.userId;
        const [user, contacts, chatMembers, messages, folders, settings] = await Promise.all([
            prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    bio: true,
                    theme: true,
                    showOnlineStatus: true,
                    showProfilePhoto: true,
                    showLastSeen: true,
                    createdAt: true,
                },
            }),
            prisma_1.default.contact.findMany({
                where: { userId },
                include: {
                    contact: {
                        select: {
                            username: true,
                            displayName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma_1.default.chatMember.findMany({
                where: { userId },
                include: {
                    chat: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            prisma_1.default.message.findMany({
                where: { senderId: userId },
                select: {
                    id: true,
                    content: true,
                    type: true,
                    chatId: true,
                    createdAt: true,
                },
                take: 1000,
            }),
            prisma_1.default.folder.findMany({
                where: { userId },
            }),
            prisma_1.default.chatSettings.findMany({
                where: { userId },
            }),
        ]);
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            user,
            contacts,
            chats: chatMembers,
            messages,
            folders,
            settings,
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="stogram-export-${userId}-${Date.now()}.json"`);
        res.json(exportData);
    }
    catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
};
exports.exportData = exportData;
const importDataSchema = zod_1.z.object({
    version: zod_1.z.string(),
    user: zod_1.z.object({
        displayName: zod_1.z.string().optional(),
        bio: zod_1.z.string().optional().nullable(),
        theme: zod_1.z.string().optional().nullable(),
        showOnlineStatus: zod_1.z.boolean().optional(),
        showProfilePhoto: zod_1.z.boolean().optional(),
        showLastSeen: zod_1.z.boolean().optional(),
    }).optional(),
    folders: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        color: zod_1.z.string().optional().nullable(),
        icon: zod_1.z.string().optional().nullable(),
        order: zod_1.z.number(),
    })).optional(),
    settings: zod_1.z.array(zod_1.z.object({
        chatId: zod_1.z.string(),
        isMuted: zod_1.z.boolean().optional(),
        isFavorite: zod_1.z.boolean().optional(),
        isArchived: zod_1.z.boolean().optional(),
    })).optional(),
});
const importData = async (req, res) => {
    try {
        const userId = req.userId;
        const validatedData = importDataSchema.parse(req.body);
        if (validatedData.user) {
            await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    displayName: validatedData.user.displayName,
                    bio: validatedData.user.bio,
                    theme: validatedData.user.theme,
                    showOnlineStatus: validatedData.user.showOnlineStatus,
                    showProfilePhoto: validatedData.user.showProfilePhoto,
                    showLastSeen: validatedData.user.showLastSeen,
                },
            });
        }
        if (validatedData.folders) {
            await prisma_1.default.folder.deleteMany({
                where: { userId },
            });
            for (const folder of validatedData.folders) {
                await prisma_1.default.folder.create({
                    data: {
                        userId,
                        name: folder.name,
                        color: folder.color,
                        icon: folder.icon,
                        order: folder.order,
                    },
                });
            }
        }
        if (validatedData.settings) {
            for (const setting of validatedData.settings) {
                const chatMember = await prisma_1.default.chatMember.findFirst({
                    where: {
                        userId,
                        chatId: setting.chatId,
                    },
                });
                if (chatMember) {
                    await prisma_1.default.chatSettings.upsert({
                        where: {
                            userId_chatId: {
                                userId,
                                chatId: setting.chatId,
                            },
                        },
                        create: {
                            userId,
                            chatId: setting.chatId,
                            isMuted: setting.isMuted || false,
                            isFavorite: setting.isFavorite || false,
                            isArchived: setting.isArchived || false,
                        },
                        update: {
                            isMuted: setting.isMuted,
                            isFavorite: setting.isFavorite,
                            isArchived: setting.isArchived,
                        },
                    });
                }
            }
        }
        res.json({
            message: 'Data imported successfully',
            imported: {
                user: !!validatedData.user,
                folders: validatedData.folders?.length || 0,
                settings: validatedData.settings?.length || 0,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Invalid import data format',
                details: error.errors,
            });
        }
        console.error('Import data error:', error);
        res.status(500).json({ error: 'Failed to import data' });
    }
};
exports.importData = importData;
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
//# sourceMappingURL=accountController.js.map