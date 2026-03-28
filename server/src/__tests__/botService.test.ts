jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    bot: {
      findUnique: jest.fn(),
    },
    chatMember: {
      findFirst: jest.fn(),
    },
    botChatInstallation: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    chat: {
      update: jest.fn(),
    },
  },
}));

import prisma from '../utils/prisma';
import { installBotInChat, sendBotMessage } from '../services/botService';

describe('botService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects bot installation when the user is not a member of the chat', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      ownerId: 'user-1',
      isActive: true,
    });
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(installBotInChat('bot-1', 'user-1', 'chat-1')).rejects.toThrow(
      'You are not a member of this chat',
    );

    expect(prisma.botChatInstallation.upsert).not.toHaveBeenCalled();
  });

  it('installs an active owned bot into a chat', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      ownerId: 'user-1',
      isActive: true,
    });
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue({
      chatId: 'chat-1',
      userId: 'user-1',
    });
    (prisma.botChatInstallation.upsert as jest.Mock).mockResolvedValue({
      id: 'install-1',
      botId: 'bot-1',
      chatId: 'chat-1',
      isActive: true,
    });

    const installation = await installBotInChat('bot-1', 'user-1', 'chat-1');

    expect(prisma.botChatInstallation.upsert).toHaveBeenCalledWith({
      where: {
        botId_chatId: {
          botId: 'bot-1',
          chatId: 'chat-1',
        },
      },
      update: {
        isActive: true,
        installedBy: 'user-1',
      },
      create: {
        botId: 'bot-1',
        chatId: 'chat-1',
        installedBy: 'user-1',
        isActive: true,
      },
      include: {
        chat: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true,
          },
        },
      },
    });
    expect(installation).toEqual({
      id: 'install-1',
      botId: 'bot-1',
      chatId: 'chat-1',
      isActive: true,
    });
  });

  it('rejects bot messages when the bot is not installed in the target chat', async () => {
    (prisma.botChatInstallation.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      sendBotMessage(
        { id: 'bot-1', ownerId: 'user-1', isActive: true },
        { chatId: 'chat-1', content: 'hello' },
      ),
    ).rejects.toThrow('Bot is not installed in this chat');

    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('creates a bot-authored message when the bot is installed in the chat', async () => {
    (prisma.botChatInstallation.findFirst as jest.Mock).mockResolvedValue({
      botId: 'bot-1',
      chatId: 'chat-1',
      isActive: true,
    });
    (prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'message-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      botId: 'bot-1',
      content: 'hello',
    });
    (prisma.chat.update as jest.Mock).mockResolvedValue({});

    const message = await sendBotMessage(
      { id: 'bot-1', ownerId: 'user-1', isActive: true },
      { chatId: 'chat-1', content: 'hello' },
    );

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        chatId: 'chat-1',
        senderId: 'user-1',
        botId: 'bot-1',
        content: 'hello',
        type: 'TEXT',
        isSent: true,
      }),
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        bot: true,
      },
    });
    expect(prisma.chat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      data: { updatedAt: expect.any(Date) },
    });
    expect(message).toEqual({
      id: 'message-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      botId: 'bot-1',
      content: 'hello',
    });
  });
});
