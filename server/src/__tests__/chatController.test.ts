jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    chat: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../services/n8nService', () => ({
  __esModule: true,
  default: {
    deliverWebhookEvent: jest.fn(() => Promise.resolve()),
  },
}));

import { Response } from 'express';
import prisma from '../utils/prisma';
import { createChat } from '../controllers/chatController';

const createResponse = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    json,
    status,
    response: { json, status } as unknown as Response,
  };
};

describe('chatController createChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reuses only exact two-member private chats', async () => {
    const { response, json, status } = createResponse();
    const exactChat = {
      id: 'private-exact',
      type: 'PRIVATE',
      members: [{ userId: 'user-1' }, { userId: 'user-2' }],
    };

    (prisma.chat.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'private-extra-member',
        type: 'PRIVATE',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
      },
      exactChat,
    ]);

    await createChat(
      {
        userId: 'user-1',
        body: {
          type: 'PRIVATE',
          memberIds: ['user-2'],
        },
      } as any,
      response
    );

    expect(prisma.chat.create).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(exactChat);
  });

  it('creates a private chat when only wider private candidates exist', async () => {
    const { response, json, status } = createResponse();
    const createdChat = {
      id: 'private-new',
      type: 'PRIVATE',
      members: [{ userId: 'user-1' }, { userId: 'user-2' }],
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
    };

    (prisma.chat.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'private-extra-member',
        type: 'PRIVATE',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
      },
    ]);
    (prisma.chat.create as jest.Mock).mockResolvedValue(createdChat);

    await createChat(
      {
        userId: 'user-1',
        body: {
          type: 'PRIVATE',
          memberIds: ['user-2'],
        },
      } as any,
      response
    );

    expect(prisma.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'PRIVATE',
        }),
      })
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdChat);
  });
});
