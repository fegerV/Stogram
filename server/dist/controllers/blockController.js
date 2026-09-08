"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserBlocked = exports.getBlockedUsers = exports.unblockUser = exports.blockUser = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const blockUser = async (req, res) => {
    try {
        const userId = req.userId;
        const { blockedId } = req.params;
        if (userId === blockedId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: blockedId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const existingBlock = await prisma_1.default.blockedUser.findUnique({
            where: {
                userId_blockedId: {
                    userId,
                    blockedId
                }
            }
        });
        if (existingBlock) {
            return res.status(400).json({ error: 'User already blocked' });
        }
        const block = await prisma_1.default.blockedUser.create({
            data: {
                userId,
                blockedId
            },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true
                    }
                }
            }
        });
        res.status(201).json({ block, message: 'User blocked successfully' });
    }
    catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ error: 'Failed to block user' });
    }
};
exports.blockUser = blockUser;
const unblockUser = async (req, res) => {
    try {
        const userId = req.userId;
        const { blockedId } = req.params;
        const block = await prisma_1.default.blockedUser.findUnique({
            where: {
                userId_blockedId: {
                    userId,
                    blockedId
                }
            }
        });
        if (!block) {
            return res.status(404).json({ error: 'User is not blocked' });
        }
        await prisma_1.default.blockedUser.delete({
            where: {
                userId_blockedId: {
                    userId,
                    blockedId
                }
            }
        });
        res.json({ message: 'User unblocked successfully' });
    }
    catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
};
exports.unblockUser = unblockUser;
const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const blockedUsers = await prisma_1.default.blockedUser.findMany({
            where: { userId },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        bio: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ blockedUsers });
    }
    catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({ error: 'Failed to get blocked users' });
    }
};
exports.getBlockedUsers = getBlockedUsers;
const isUserBlocked = async (req, res) => {
    try {
        const userId = req.userId;
        const { targetUserId } = req.params;
        const block = await prisma_1.default.blockedUser.findUnique({
            where: {
                userId_blockedId: {
                    userId,
                    blockedId: targetUserId
                }
            }
        });
        res.json({ isBlocked: !!block });
    }
    catch (error) {
        console.error('Check if user blocked error:', error);
        res.status(500).json({ error: 'Failed to check block status' });
    }
};
exports.isUserBlocked = isUserBlocked;
//# sourceMappingURL=blockController.js.map