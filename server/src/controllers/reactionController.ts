import { Request, Response } from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { z } from 'zod';

const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

/**
 * Add reaction to a message
 */
export const addReaction = async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = addReactionSchema.parse(req.body);
    const userId = req.userId;

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is a member of the chat
    const isMember = message.chat.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create or update reaction
    const reaction = await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      create: {
        messageId,
        userId,
        emoji,
      },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Emit to all chat members
    const memberIds = message.chat.members.map((m: { userId: string }) => m.userId);
    memberIds.forEach((memberId: string) => {
      io.to(`user:${memberId}`).emit('reaction:add', {
        messageId,
        reaction,
      });
    });

    res.json(reaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

/**
 * Remove reaction from a message
 */
export const removeReaction = async (req: any, res: Response) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.userId;

    // Check if reaction exists
    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: decodeURIComponent(emoji),
        },
      },
      include: {
        message: {
          include: {
            chat: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    // Delete reaction
    await prisma.reaction.delete({
      where: {
        id: reaction.id,
      },
    });

    // Emit to all chat members
    const memberIds = reaction.message.chat.members.map((m: { userId: string }) => m.userId);
    memberIds.forEach((memberId: string) => {
      io.to(`user:${memberId}`).emit('reaction:remove', {
        messageId,
        userId,
        emoji: decodeURIComponent(emoji),
      });
    });

    res.json({ message: 'Reaction removed' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

/**
 * Get reactions for a message
 */
export const getReactions = async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;

    const reactions = await prisma.reaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by emoji
    const grouped = reactions.reduce((acc: any, reaction: any) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof reactions>);

    res.json(grouped);
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
};
