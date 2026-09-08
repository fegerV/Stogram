"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSearchHistoryItem = exports.clearSearchHistory = exports.getSearchHistory = exports.searchByMention = exports.searchByHashtag = exports.searchMessages = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const searchMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { query, chatId, type, dateFrom, dateTo, senderId, limit = 50 } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
        // Get all chats user is member of
        const userChatIds = await prisma_1.default.chatMember.findMany({
            where: { userId },
            select: { chatId: true }
        });
        const chatIds = userChatIds.map((cm) => cm.chatId);
        // Build where clause with filters
        const whereClause = {
            chatId: chatId ? String(chatId) : { in: chatIds },
            isDeleted: false,
        };
        // Text search on content and fileName
        if (query) {
            whereClause.OR = [
                { content: { contains: query, mode: 'insensitive' } },
                { fileName: { contains: query, mode: 'insensitive' } }
            ];
        }
        // Filter by message type
        if (type) {
            const typeFilter = String(type).toUpperCase();
            switch (typeFilter) {
                case 'MEDIA':
                    whereClause.type = { in: ['IMAGE', 'VIDEO', 'AUDIO', 'VOICE', 'GIF'] };
                    break;
                case 'LINK':
                    whereClause.OR = [
                        { content: { contains: query, mode: 'insensitive' } },
                        { linkPreview: { not: null } }
                    ];
                    break;
                case 'FILE':
                    whereClause.type = { in: ['FILE'] };
                    break;
                case 'PHOTO':
                    whereClause.type = 'IMAGE';
                    break;
                case 'VIDEO':
                    whereClause.type = 'VIDEO';
                    break;
                case 'AUDIO':
                    whereClause.type = { in: ['AUDIO', 'VOICE'] };
                    break;
                case 'DOCUMENT':
                    whereClause.type = 'FILE';
                    break;
                default:
                    whereClause.type = typeFilter;
            }
        }
        // Filter by date range
        if (dateFrom) {
            whereClause.createdAt = {
                ...whereClause.createdAt,
                gte: new Date(String(dateFrom))
            };
        }
        if (dateTo) {
            whereClause.createdAt = {
                ...whereClause.createdAt,
                lte: new Date(String(dateTo))
            };
        }
        // Filter by sender
        if (senderId) {
            whereClause.senderId = String(senderId);
        }
        const messages = await prisma_1.default.message.findMany({
            where: whereClause,
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
            },
            orderBy: { createdAt: 'desc' },
            take: normalizedLimit
        });
        // Save search to history (async, don't block response)
        saveSearchHistory(userId, query, { type, dateFrom, dateTo, senderId, chatId }).catch(console.error);
        res.json({ messages });
    }
    catch (error) {
        console.error('Search messages error:', error);
        res.status(500).json({ error: 'Failed to search messages' });
    }
};
exports.searchMessages = searchMessages;
const searchByHashtag = async (req, res) => {
    try {
        const userId = req.userId;
        const { hashtag } = req.params;
        if (!hashtag) {
            return res.status(400).json({ error: 'Hashtag is required' });
        }
        const userChatIds = await prisma_1.default.chatMember.findMany({
            where: { userId },
            select: { chatId: true }
        });
        const chatIds = userChatIds.map((cm) => cm.chatId);
        const messages = await prisma_1.default.message.findMany({
            where: {
                chatId: { in: chatIds },
                isDeleted: false,
                hashtags: { contains: hashtag }
            },
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
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ messages });
    }
    catch (error) {
        console.error('Search by hashtag error:', error);
        res.status(500).json({ error: 'Failed to search by hashtag' });
    }
};
exports.searchByHashtag = searchByHashtag;
const searchByMention = async (req, res) => {
    try {
        const userId = req.userId;
        const username = req.params.username || req.user?.username;
        const userChatIds = await prisma_1.default.chatMember.findMany({
            where: { userId },
            select: { chatId: true }
        });
        const chatIds = userChatIds.map((cm) => cm.chatId);
        const messages = await prisma_1.default.message.findMany({
            where: {
                chatId: { in: chatIds },
                isDeleted: false,
                mentions: { contains: username }
            },
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
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ messages });
    }
    catch (error) {
        console.error('Search by mention error:', error);
        res.status(500).json({ error: 'Failed to search mentions' });
    }
};
exports.searchByMention = searchByMention;
// Save search query to history
async function saveSearchHistory(userId, query, filters) {
    try {
        // Delete old entries if we exceed 10 searches
        const count = await prisma_1.default.searchHistory.count({
            where: { userId }
        });
        if (count >= 10) {
            // Delete the oldest entries
            const oldestEntries = await prisma_1.default.searchHistory.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                take: count - 9,
                select: { id: true }
            });
            await prisma_1.default.searchHistory.deleteMany({
                where: {
                    id: { in: oldestEntries.map(e => e.id) }
                }
            });
        }
        // Check if this exact query already exists (update timestamp instead of duplicate)
        const existing = await prisma_1.default.searchHistory.findFirst({
            where: { userId, query }
        });
        if (existing) {
            await prisma_1.default.searchHistory.update({
                where: { id: existing.id },
                data: {
                    createdAt: new Date(),
                    filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : null
                }
            });
        }
        else {
            await prisma_1.default.searchHistory.create({
                data: {
                    userId,
                    query,
                    filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : null
                }
            });
        }
    }
    catch (error) {
        console.error('Save search history error:', error);
    }
}
// Get search history for user
const getSearchHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const history = await prisma_1.default.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                query: true,
                filters: true,
                createdAt: true
            }
        });
        res.json({ history });
    }
    catch (error) {
        console.error('Get search history error:', error);
        res.status(500).json({ error: 'Failed to get search history' });
    }
};
exports.getSearchHistory = getSearchHistory;
// Clear search history for user
const clearSearchHistory = async (req, res) => {
    try {
        const userId = req.userId;
        await prisma_1.default.searchHistory.deleteMany({
            where: { userId }
        });
        res.json({ message: 'Search history cleared' });
    }
    catch (error) {
        console.error('Clear search history error:', error);
        res.status(500).json({ error: 'Failed to clear search history' });
    }
};
exports.clearSearchHistory = clearSearchHistory;
// Delete single search history entry
const deleteSearchHistoryItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { historyId } = req.params;
        await prisma_1.default.searchHistory.deleteMany({
            where: { id: historyId, userId }
        });
        res.json({ message: 'Search history item deleted' });
    }
    catch (error) {
        console.error('Delete search history item error:', error);
        res.status(500).json({ error: 'Failed to delete search history item' });
    }
};
exports.deleteSearchHistoryItem = deleteSearchHistoryItem;
//# sourceMappingURL=searchController.js.map