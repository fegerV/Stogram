jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    message: {
      findFirst: jest.fn(),
    },
    chat: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    sticker: {
      findFirst: jest.fn(),
    },
    stickerPack: {
      findFirst: jest.fn(),
    },
  },
}));

import fs from 'fs';
import { Response } from 'express';
import prisma from '../utils/prisma';
import { serveUploadedMedia } from '../controllers/mediaController';

const createResponse = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const setHeader = jest.fn();
  const sendFile = jest.fn();
  const download = jest.fn();

  return {
    json,
    status,
    setHeader,
    sendFile,
    download,
    response: { json, status, setHeader, sendFile, download } as unknown as Response,
  };
};

describe('mediaController serveUploadedMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.sticker.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.stickerPack.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('serves message media only when the requester belongs to the message chat', async () => {
    const { response, sendFile, status } = createResponse();
    (prisma.message.findFirst as jest.Mock).mockResolvedValue({ id: 'message-1' });

    await serveUploadedMedia(
      {
        userId: 'user-1',
        params: { 0: 'file.jpg' },
        query: {},
      } as any,
      response
    );

    expect(prisma.message.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([{ fileUrl: '/uploads/file.jpg' }]),
        chat: {
          members: {
            some: { userId: 'user-1' },
          },
        },
      }),
      select: { id: true },
    });
    expect(status).not.toHaveBeenCalled();
    expect(sendFile).toHaveBeenCalled();
  });

  it('returns 404 when no accessible media owner is found', async () => {
    const { response, json, status, sendFile } = createResponse();

    await serveUploadedMedia(
      {
        userId: 'user-2',
        params: { 0: 'file.jpg' },
        query: {},
      } as any,
      response
    );

    expect(sendFile).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Media not found' });
  });
});
