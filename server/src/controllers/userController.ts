import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';
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

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { displayName, bio, status } = req.body;

    let avatar;
    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(status && { status }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        lastSeen: true,
      },
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
