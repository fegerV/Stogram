"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = exports.checkExpiredMessages = exports.checkScheduledMessages = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const index_1 = require("../index");
/**
 * Check and send scheduled messages
 */
const checkScheduledMessages = async () => {
    try {
        const now = new Date();
        // Find all scheduled messages that should be sent now
        const scheduledMessages = await prisma_1.default.message.findMany({
            where: {
                scheduledFor: {
                    lte: now,
                },
                isSent: false,
                isDeleted: false,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
                chat: {
                    include: {
                        members: {
                            select: {
                                userId: true,
                            },
                        },
                    },
                },
            },
        });
        for (const message of scheduledMessages) {
            try {
                // Mark as sent
                const sentMessage = await prisma_1.default.message.update({
                    where: { id: message.id },
                    data: { isSent: true },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true,
                                status: true,
                                lastSeen: true,
                                createdAt: true,
                            },
                        },
                        replyTo: {
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
                // Emit to all chat members
                const memberIds = message.chat.members.map((m) => m.userId);
                memberIds.forEach((userId) => {
                    index_1.io.to(`user:${userId}`).emit('message:new', sentMessage);
                });
                console.log(`Scheduled message ${message.id} sent successfully`);
            }
            catch (error) {
                console.error(`Error sending scheduled message ${message.id}:`, error);
            }
        }
    }
    catch (error) {
        console.error('Error checking scheduled messages:', error);
    }
};
exports.checkScheduledMessages = checkScheduledMessages;
/**
 * Check and delete expired self-destructing messages
 */
const checkExpiredMessages = async () => {
    try {
        const now = new Date();
        // Find all messages that should be deleted
        const expiredMessages = await prisma_1.default.message.findMany({
            where: {
                expiresAt: {
                    lte: now,
                },
                isDeleted: false,
            },
            select: {
                id: true,
                chatId: true,
            },
        });
        if (expiredMessages.length > 0) {
            // Delete expired messages
            await prisma_1.default.message.updateMany({
                where: {
                    id: { in: expiredMessages.map((m) => m.id) },
                },
                data: {
                    isDeleted: true,
                    content: 'This message has been deleted',
                },
            });
            // Emit deletion events to chat participants
            const chatIds = [...new Set(expiredMessages.map((m) => m.chatId))];
            chatIds.forEach((chatId) => {
                const messageIds = expiredMessages
                    .filter((m) => m.chatId === chatId)
                    .map((m) => m.id);
                index_1.io.to(`chat:${chatId}`).emit('message:expired', { messageIds });
            });
            console.log(`Deleted ${expiredMessages.length} expired messages`);
        }
    }
    catch (error) {
        console.error('Error checking expired messages:', error);
    }
};
exports.checkExpiredMessages = checkExpiredMessages;
/**
 * Initialize scheduler
 */
const initScheduler = () => {
    // Run every minute to check for scheduled messages and expired messages
    node_cron_1.default.schedule('* * * * *', () => {
        (0, exports.checkScheduledMessages)();
        (0, exports.checkExpiredMessages)();
    });
    console.log('📅 Message scheduler initialized');
};
exports.initScheduler = initScheduler;
//# sourceMappingURL=schedulerService.js.map