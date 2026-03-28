jest.mock('../services/n8nService', () => ({
  __esModule: true,
  default: {
    createWebhook: jest.fn(),
    testWebhook: jest.fn(),
  },
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
    n8nConfig: {
      findFirst: jest.fn(),
    },
    chatMember: {
      findFirst: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    chat: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../index', () => ({
  io: {
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
}));

import { Response } from 'express';
import prisma from '../utils/prisma';
import { io } from '../index';
import { createWebhook, n8nWebhook, testWebhook } from '../controllers/n8nSettingsController';

describe('n8nSettingsController', () => {
  let consoleLogSpy: jest.SpyInstance;
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { json, status } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('rejects private webhook urls on create', async () => {
    const request = {
      body: {
        name: 'Local webhook',
        webhookUrl: 'http://localhost:5678/webhook',
        events: ['new_message'],
      },
    } as any;

    await createWebhook(request, response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'Webhook URL cannot target localhost or private network hosts',
    });
  });

  it('rejects create_chat when some members are missing', async () => {
    (prisma.n8nConfig.findFirst as jest.Mock).mockResolvedValue({ apiKey: null });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'owner-1' }]);

    const request = {
      headers: {},
      body: {
        action: 'create_chat',
        data: {
          userId: 'owner-1',
          type: 'GROUP',
          name: 'Automation chat',
          memberIds: ['user-2'],
        },
      },
    } as any;

    await n8nWebhook(request, response);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: 'Some members were not found',
      missingMemberIds: ['user-2'],
    });
  });

  it('emits realtime event when send_message succeeds', async () => {
    const emit = jest.fn();
    (io.to as jest.Mock).mockReturnValue({ emit });
    (prisma.n8nConfig.findFirst as jest.Mock).mockResolvedValue({ apiKey: null });
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue({ chatId: 'chat-1', userId: 'user-1' });
    (prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'message-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      content: 'hello',
      sender: { id: 'user-1', username: 'user', displayName: 'User', avatar: null },
    });
    (prisma.chat.update as jest.Mock).mockResolvedValue({});

    const request = {
      headers: {},
      body: {
        action: 'send_message',
        data: {
          userId: 'user-1',
          chatId: 'chat-1',
          content: 'hello',
        },
      },
    } as any;

    await n8nWebhook(request, response);

    expect(io.to).toHaveBeenCalledWith('chat:chat-1');
    expect(emit).toHaveBeenCalledWith('message:new', expect.objectContaining({ id: 'message-1' }));
  });
});
