"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.getCurrentUser = exports.getPrivacySettings = exports.updatePrivacySettings = exports.updateTheme = exports.subscribeToPush = exports.removeContact = exports.addContact = exports.getContacts = exports.changePassword = exports.updateProfile = exports.getUserById = exports.searchUsers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const pushService_1 = require("../services/pushService");
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.userId;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter required' });
        }
        const users = await prisma_1.default.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { displayName: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
            },
            orderBy: [
                // Prioritize exact matches and starts with
                { username: 'asc' },
                { displayName: 'asc' },
            ],
            take: 20,
        });
        res.json(users);
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
};
exports.searchUsers = searchUsers;
const getUserById = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.userId;
        // Получаем настройки приватности целевого пользователя
        const user = await prisma_1.default.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
                lastSeen: true,
                createdAt: true,
                showOnlineStatus: true,
                showProfilePhoto: true,
                showLastSeen: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Если пользователь запрашивает свой собственный профиль - возвращаем всё
        if (targetUserId === currentUserId) {
            const { showOnlineStatus, showProfilePhoto, showLastSeen, ...publicUser } = user;
            return res.json(publicUser);
        }
        // Проверяем, являются ли пользователи контактами
        const contact = await prisma_1.default.contact.findFirst({
            where: {
                userId: currentUserId,
                contactId: targetUserId,
            },
        });
        const isContact = !!contact;
        // Применяем настройки приватности
        const resultUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            createdAt: user.createdAt,
        };
        // Показываем аватар только если разрешено или это контакт
        if (user.showProfilePhoto || isContact) {
            resultUser.avatar = user.avatar;
        }
        // Показываем статус только если разрешено или это контакт
        if (user.showOnlineStatus || isContact) {
            resultUser.status = user.status;
        }
        // Показываем lastSeen только если разрешено или это контакт
        if (user.showLastSeen || isContact) {
            resultUser.lastSeen = user.lastSeen;
        }
        res.json(resultUser);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
const updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    status: zod_1.z.string().max(100).optional(),
});
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        // Extract text fields from FormData (multer parses them into req.body)
        const bodyData = {};
        if (req.body.displayName !== undefined)
            bodyData.displayName = req.body.displayName;
        if (req.body.bio !== undefined)
            bodyData.bio = req.body.bio;
        if (req.body.status !== undefined)
            bodyData.status = req.body.status;
        // Validate only if text fields are provided
        if (Object.keys(bodyData).length > 0) {
            const validation = updateProfileSchema.safeParse(bodyData);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: validation.error.errors
                });
            }
        }
        const { displayName, bio, status } = bodyData;
        // Handle avatar file upload
        let avatar;
        if (req.file) {
            avatar = `/uploads/${req.file.filename}`;
            console.log(`Avatar uploaded: ${avatar} for user ${userId}`);
            // Optionally delete old avatar file if exists
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { avatar: true },
            });
            if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/')) {
                const fs = require('fs');
                const path = require('path');
                const oldAvatarPath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(currentUser.avatar));
                try {
                    if (fs.existsSync(oldAvatarPath)) {
                        fs.unlinkSync(oldAvatarPath);
                        console.log(`Deleted old avatar: ${oldAvatarPath}`);
                    }
                }
                catch (err) {
                    console.error('Error deleting old avatar:', err);
                    // Don't fail the request if old avatar deletion fails
                }
            }
        }
        // Build update data object
        const updateData = {};
        if (displayName !== undefined && displayName !== '')
            updateData.displayName = displayName;
        if (bio !== undefined)
            updateData.bio = bio || null; // Allow empty bio
        if (status !== undefined && status !== '')
            updateData.status = status;
        if (avatar)
            updateData.avatar = avatar;
        // Only update if there's something to update
        if (Object.keys(updateData).length === 0) {
            // If only file was sent but it's the same, or no changes, return current user
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    bio: true,
                    status: true,
                    lastSeen: true,
                    createdAt: true,
                },
            });
            return res.json(currentUser);
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
                lastSeen: true,
                createdAt: true,
            },
        });
        console.log(`Profile updated for user ${userId}:`, {
            displayName: user.displayName,
            hasAvatar: !!user.avatar,
            avatar: user.avatar
        });
        res.json(user);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid current password' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
exports.changePassword = changePassword;
const getContacts = async (req, res) => {
    try {
        const userId = req.userId;
        const contacts = await prisma_1.default.contact.findMany({
            where: { userId },
            include: {
                contact: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        bio: true,
                        status: true,
                        lastSeen: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(contacts);
    }
    catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
};
exports.getContacts = getContacts;
const addContact = async (req, res) => {
    try {
        const userId = req.userId;
        const { contactId, nickname } = req.body;
        if (userId === contactId) {
            return res.status(400).json({ error: 'Cannot add yourself as contact' });
        }
        const existingContact = await prisma_1.default.contact.findFirst({
            where: { userId, contactId },
        });
        if (existingContact) {
            return res.status(400).json({ error: 'Contact already exists' });
        }
        const contact = await prisma_1.default.contact.create({
            data: { userId, contactId, nickname },
            include: {
                contact: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        bio: true,
                        status: true,
                    },
                },
            },
        });
        res.status(201).json(contact);
    }
    catch (error) {
        console.error('Add contact error:', error);
        res.status(500).json({ error: 'Failed to add contact' });
    }
};
exports.addContact = addContact;
const removeContact = async (req, res) => {
    try {
        const userId = req.userId;
        const { contactId } = req.params;
        await prisma_1.default.contact.deleteMany({
            where: { userId, contactId },
        });
        res.json({ message: 'Contact removed successfully' });
    }
    catch (error) {
        console.error('Remove contact error:', error);
        res.status(500).json({ error: 'Failed to remove contact' });
    }
};
exports.removeContact = removeContact;
const subscribeToPush = async (req, res) => {
    try {
        const userId = req.userId;
        const { subscription } = req.body;
        if (!subscription) {
            return res.status(400).json({ error: 'Subscription data required' });
        }
        await (0, pushService_1.savePushSubscription)(userId, JSON.stringify(subscription));
        res.json({ message: 'Push subscription saved successfully' });
    }
    catch (error) {
        console.error('Subscribe to push error:', error);
        res.status(500).json({ error: 'Failed to save push subscription' });
    }
};
exports.subscribeToPush = subscribeToPush;
const updateTheme = async (req, res) => {
    try {
        const userId = req.userId;
        const { theme } = req.body;
        if (!theme || (theme !== 'light' && theme !== 'dark')) {
            return res.status(400).json({ error: 'Valid theme required (light or dark)' });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { theme },
        });
        res.json({ message: 'Theme updated successfully', theme });
    }
    catch (error) {
        console.error('Update theme error:', error);
        res.status(500).json({ error: 'Failed to update theme' });
    }
};
exports.updateTheme = updateTheme;
const updatePrivacySettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { showOnlineStatus, showProfilePhoto, showLastSeen } = req.body;
        // Validate input types and build update data
        const updateData = {};
        if (showOnlineStatus !== undefined) {
            if (typeof showOnlineStatus !== 'boolean') {
                return res.status(400).json({ error: 'showOnlineStatus must be a boolean' });
            }
            updateData.showOnlineStatus = showOnlineStatus;
        }
        if (showProfilePhoto !== undefined) {
            if (typeof showProfilePhoto !== 'boolean') {
                return res.status(400).json({ error: 'showProfilePhoto must be a boolean' });
            }
            updateData.showProfilePhoto = showProfilePhoto;
        }
        if (showLastSeen !== undefined) {
            if (typeof showLastSeen !== 'boolean') {
                return res.status(400).json({ error: 'showLastSeen must be a boolean' });
            }
            updateData.showLastSeen = showLastSeen;
        }
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            // Return current settings if nothing to update
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    showOnlineStatus: true,
                    showProfilePhoto: true,
                    showLastSeen: true,
                },
            });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json({ message: 'No changes to update', settings: currentUser });
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                showOnlineStatus: true,
                showProfilePhoto: true,
                showLastSeen: true,
            },
        });
        res.json({ message: 'Privacy settings updated successfully', settings: user });
    }
    catch (error) {
        console.error('Update privacy settings error:', error);
        // Provide more detailed error message
        const errorMessage = error?.message || 'Failed to update privacy settings';
        res.status(500).json({ error: errorMessage });
    }
};
exports.updatePrivacySettings = updatePrivacySettings;
const getPrivacySettings = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                showOnlineStatus: true,
                showProfilePhoto: true,
                showLastSeen: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get privacy settings error:', error);
        res.status(500).json({ error: 'Failed to get privacy settings' });
    }
};
exports.getPrivacySettings = getPrivacySettings;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                status: true,
                lastSeen: true,
                createdAt: true,
                theme: true,
                showOnlineStatus: true,
                showProfilePhoto: true,
                showLastSeen: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to fetch current user' });
    }
};
exports.getCurrentUser = getCurrentUser;
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                notificationsPush: true,
                notificationsEmail: true,
                notificationsSound: true,
                notificationsVibration: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.userId;
        const { notificationsPush, notificationsEmail, notificationsSound, notificationsVibration } = req.body;
        // Validate input types and build update data
        const updateData = {};
        if (notificationsPush !== undefined) {
            if (typeof notificationsPush !== 'boolean') {
                return res.status(400).json({ error: 'notificationsPush must be a boolean' });
            }
            updateData.notificationsPush = notificationsPush;
        }
        if (notificationsEmail !== undefined) {
            if (typeof notificationsEmail !== 'boolean') {
                return res.status(400).json({ error: 'notificationsEmail must be a boolean' });
            }
            updateData.notificationsEmail = notificationsEmail;
        }
        if (notificationsSound !== undefined) {
            if (typeof notificationsSound !== 'boolean') {
                return res.status(400).json({ error: 'notificationsSound must be a boolean' });
            }
            updateData.notificationsSound = notificationsSound;
        }
        if (notificationsVibration !== undefined) {
            if (typeof notificationsVibration !== 'boolean') {
                return res.status(400).json({ error: 'notificationsVibration must be a boolean' });
            }
            updateData.notificationsVibration = notificationsVibration;
        }
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            // Return current preferences if nothing to update
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    notificationsPush: true,
                    notificationsEmail: true,
                    notificationsSound: true,
                    notificationsVibration: true,
                },
            });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json({ message: 'No changes to update', preferences: currentUser });
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                notificationsPush: true,
                notificationsEmail: true,
                notificationsSound: true,
                notificationsVibration: true,
            },
        });
        res.json({ message: 'Notification preferences updated successfully', preferences: user });
    }
    catch (error) {
        console.error('Update notification preferences error:', error);
        // Provide more detailed error message
        const errorMessage = error?.message || 'Failed to update notification preferences';
        res.status(500).json({ error: errorMessage });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
//# sourceMappingURL=userController.js.map