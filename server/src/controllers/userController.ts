import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { savePushSubscription } from '../services/pushService';

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.userId!;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { username: { contains: query } },
              { displayName: { contains: query } },
              { email: { contains: query } },
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
      take: 20,
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  status: z.string().max(100).optional(),
});

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Extract text fields from FormData (multer parses them into req.body)
    const bodyData: any = {};
    if (req.body.displayName !== undefined) bodyData.displayName = req.body.displayName;
    if (req.body.bio !== undefined) bodyData.bio = req.body.bio;
    if (req.body.status !== undefined) bodyData.status = req.body.status;

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
      const currentUser = await prisma.user.findUnique({
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
        } catch (err) {
          console.error('Error deleting old avatar:', err);
          // Don't fail the request if old avatar deletion fails
        }
      }
    }

    // Build update data object
    const updateData: any = {};
    if (displayName !== undefined && displayName !== '') updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio || null; // Allow empty bio
    if (status !== undefined && status !== '') updateData.status = status;
    if (avatar) updateData.avatar = avatar;

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      // If only file was sent but it's the same, or no changes, return current user
      const currentUser = await prisma.user.findUnique({
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

    const user = await prisma.user.update({
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
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const contacts = await prisma.contact.findMany({
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
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

export const addContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { contactId, nickname } = req.body;

    if (userId === contactId) {
      return res.status(400).json({ error: 'Cannot add yourself as contact' });
    }

    const existingContact = await prisma.contact.findFirst({
      where: { userId, contactId },
    });

    if (existingContact) {
      return res.status(400).json({ error: 'Contact already exists' });
    }

    const contact = await prisma.contact.create({
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
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  }
};

export const removeContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { contactId } = req.params;

    await prisma.contact.deleteMany({
      where: { userId, contactId },
    });

    res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ error: 'Failed to remove contact' });
  }
};

export const subscribeToPush = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription data required' });
    }

    await savePushSubscription(userId, JSON.stringify(subscription));

    res.json({ message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Subscribe to push error:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
};

export const updateTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { theme } = req.body;

    if (!theme || (theme !== 'light' && theme !== 'dark')) {
      return res.status(400).json({ error: 'Valid theme required (light or dark)' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { theme },
    });

    res.json({ message: 'Theme updated successfully', theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
};

export const updatePrivacySettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { showOnlineStatus, showProfilePhoto, showLastSeen } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(showOnlineStatus !== undefined && { showOnlineStatus }),
        ...(showProfilePhoto !== undefined && { showProfilePhoto }),
        ...(showLastSeen !== undefined && { showLastSeen }),
      },
      select: {
        id: true,
        showOnlineStatus: true,
        showProfilePhoto: true,
        showLastSeen: true,
      },
    });

    res.json({ message: 'Privacy settings updated successfully', settings: user });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
};

export const getPrivacySettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ error: 'Failed to get privacy settings' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};

export const getNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
};

export const updateNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { notificationsPush, notificationsEmail, notificationsSound, notificationsVibration } = req.body;

    const updateData: any = {};
    
    if (notificationsPush !== undefined && typeof notificationsPush === 'boolean') {
      updateData.notificationsPush = notificationsPush;
    }
    if (notificationsEmail !== undefined && typeof notificationsEmail === 'boolean') {
      updateData.notificationsEmail = notificationsEmail;
    }
    if (notificationsSound !== undefined && typeof notificationsSound === 'boolean') {
      updateData.notificationsSound = notificationsSound;
    }
    if (notificationsVibration !== undefined && typeof notificationsVibration === 'boolean') {
      updateData.notificationsVibration = notificationsVibration;
    }

    const user = await prisma.user.update({
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
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
};
