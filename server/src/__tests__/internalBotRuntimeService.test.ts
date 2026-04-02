jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    message: {
      findUnique: jest.fn(),
    },
    botChatInstallation: {
      findMany: jest.fn(),
    },
    webhook: {
      count: jest.fn(),
    },
    bot: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../services/botApiCompatibilityService', () => ({
  __esModule: true,
  default: {
    publishMessageUpdate: jest.fn(),
  },
}));

jest.mock('../services/botService', () => ({
  __esModule: true,
  sendBotMessage: jest.fn(),
}));

jest.mock('../services/webhookService', () => ({
  __esModule: true,
  deliverToBotWebhooks: jest.fn().mockResolvedValue([]),
}));

jest.mock('../index', () => ({
  io: {
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
}));

import prisma from '../utils/prisma';
import botApiCompatibilityService from '../services/botApiCompatibilityService';
import { sendBotMessage } from '../services/botService';
import { deliverToBotWebhooks } from '../services/webhookService';
import { io } from '../index';
import internalBotRuntimeService from '../services/internalBotRuntimeService';

describe('internalBotRuntimeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches command.received and sends a default reply for /start without external runtime', async () => {
    const emit = jest.fn();
    (io.to as jest.Mock).mockReturnValue({ emit });

    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 'message-1',
      content: '/start',
      type: 'TEXT',
      createdAt: new Date('2026-03-28T12:00:00Z'),
      updatedAt: new Date('2026-03-28T12:00:00Z'),
      senderId: 'user-1',
      botId: null,
      linkPreview: null,
      sender: {
        id: 'user-1',
        username: 'user',
        displayName: 'User',
        avatar: null,
      },
      chat: {
        id: 'chat-1',
        type: 'PRIVATE',
        name: null,
        description: null,
        members: [
          {
            role: 'MEMBER',
            user: {
              id: 'user-1',
              username: 'user',
              displayName: 'User',
            },
          },
        ],
      },
      bot: null,
    });

    (prisma.botChatInstallation.findMany as jest.Mock).mockResolvedValue([
      {
        bot: {
          id: 'bot-1',
          ownerId: 'owner-1',
          isActive: true,
          username: 'helperbot',
          displayName: 'Helper Bot',
          webhookUrl: null,
          isInline: false,
          commands: [],
        },
      },
    ]);

    (prisma.bot.findUnique as jest.Mock).mockImplementation(({ select }) => {
      if (select?.webhookUrl) {
        return Promise.resolve({ webhookUrl: null });
      }

      return Promise.resolve({
        id: 'bot-1',
        username: 'helperbot',
        displayName: 'Helper Bot',
        token: 'bot-token',
        webhookUrl: null,
        ownerId: 'owner-1',
        isInline: false,
      });
    });

    (prisma.webhook.count as jest.Mock).mockResolvedValue(0);
    (sendBotMessage as jest.Mock).mockResolvedValue({
      id: 'reply-1',
      chatId: 'chat-1',
      content: 'hello',
    });

    await internalBotRuntimeService.dispatchChatMessageEvent('message-1', 'message.created');

    expect(deliverToBotWebhooks).toHaveBeenCalledTimes(2);
    expect(deliverToBotWebhooks).toHaveBeenNthCalledWith(
      1,
      'bot-1',
      'message.created',
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.objectContaining({
            id: 'message-1',
            content: '/start',
          }),
        }),
      }),
    );
    expect(deliverToBotWebhooks).toHaveBeenNthCalledWith(
      2,
      'bot-1',
      'command.received',
      expect.objectContaining({
        data: expect.objectContaining({
          command: expect.objectContaining({
            command: '/start',
            raw: '/start',
          }),
        }),
      }),
    );
    expect(botApiCompatibilityService.publishMessageUpdate).toHaveBeenCalledWith(
      'bot-1',
      'message-1',
      'message',
    );
    expect(sendBotMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bot-1',
        displayName: 'Helper Bot',
      }),
      expect.objectContaining({
        chatId: 'chat-1',
        type: 'TEXT',
      }),
    );
    expect(emit).toHaveBeenCalledWith('message:new', {
      id: 'reply-1',
      chatId: 'chat-1',
      content: 'hello',
    });
  });

  it('does not dispatch runtime events back to the same bot author', async () => {
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 'message-1',
      content: 'bot says hi',
      type: 'TEXT',
      createdAt: new Date('2026-03-28T12:00:00Z'),
      updatedAt: new Date('2026-03-28T12:00:00Z'),
      senderId: 'owner-1',
      botId: 'bot-1',
      linkPreview: null,
      sender: {
        id: 'owner-1',
        username: 'owner',
        displayName: 'Owner',
        avatar: null,
      },
      chat: {
        id: 'chat-1',
        type: 'PRIVATE',
        name: null,
        description: null,
        members: [],
      },
      bot: {
        id: 'bot-1',
        username: 'helperbot',
        displayName: 'Helper Bot',
      },
    });

    (prisma.botChatInstallation.findMany as jest.Mock).mockResolvedValue([
      {
        bot: {
          id: 'bot-1',
          ownerId: 'owner-1',
          isActive: true,
          username: 'helperbot',
          displayName: 'Helper Bot',
          webhookUrl: null,
          isInline: false,
          commands: [],
        },
      },
    ]);

    await internalBotRuntimeService.dispatchChatMessageEvent('message-1', 'message.created');

    expect(deliverToBotWebhooks).not.toHaveBeenCalled();
    expect(botApiCompatibilityService.publishMessageUpdate).not.toHaveBeenCalled();
    expect(sendBotMessage).not.toHaveBeenCalled();
  });
});
