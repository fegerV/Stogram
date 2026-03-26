import { Request, Response } from 'express';
import botApiCompatibilityService from '../services/botApiCompatibilityService';
import prisma from '../utils/prisma';
import { io } from '../index';

const getToken = (req: Request) => req.params.token;

const handleBotApiError = (error: unknown, res: Response) => {
  const message = error instanceof Error ? error.message : 'Bot API request failed';
  const status = message.includes('Invalid bot token')
    ? 401
    : message.includes('not found')
      ? 404
      : 400;

  res.status(status).json({ ok: false, description: message });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    res.json(await botApiCompatibilityService.getMe(getToken(req)));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const setWebhook = async (req: Request, res: Response) => {
  try {
    const { url, secret_token: secretToken } = req.body;
    res.json(await botApiCompatibilityService.setWebhook(getToken(req), url, secretToken));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const dropPendingUpdates = Boolean(req.body?.drop_pending_updates);
    res.json(await botApiCompatibilityService.deleteWebhook(getToken(req), dropPendingUpdates));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const getWebhookInfo = async (req: Request, res: Response) => {
  try {
    res.json(await botApiCompatibilityService.getWebhookInfo(getToken(req)));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const getUpdates = async (req: Request, res: Response) => {
  try {
    const offset = req.method === 'GET' ? req.query.offset : req.body?.offset;
    const limit = req.method === 'GET' ? req.query.limit : req.body?.limit;
    res.json(
      await botApiCompatibilityService.getUpdates(getToken(req), {
        offset: offset !== undefined ? Number(offset) : undefined,
        limit: limit !== undefined ? Number(limit) : undefined,
      })
    );
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const setMyCommands = async (req: Request, res: Response) => {
  try {
    const commands = Array.isArray(req.body?.commands) ? req.body.commands : [];
    res.json(await botApiCompatibilityService.setMyCommands(getToken(req), commands));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const getMyCommands = async (req: Request, res: Response) => {
  try {
    res.json(await botApiCompatibilityService.getMyCommands(getToken(req)));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const setChatMenuButton = async (req: Request, res: Response) => {
  try {
    res.json(await botApiCompatibilityService.setChatMenuButton(getToken(req), req.body.menu_button || { type: 'default' }));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const getChatMenuButton = async (req: Request, res: Response) => {
  try {
    res.json(await botApiCompatibilityService.getChatMenuButton(getToken(req)));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.sendMessage(getToken(req), req.body);
    const appMessage = await prisma.message.findUnique({
      where: { id: String((result.result as any).message_id) },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    if (appMessage) {
      io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
    }
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const sendPhoto = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.sendMedia(getToken(req), {
      chat_id: req.body.chat_id,
      mediaUrl: req.body.photo,
      caption: req.body.caption,
      fileName: req.body.file_name,
      type: 'IMAGE',
    });
    const appMessage = await prisma.message.findUnique({
      where: { id: String((result.result as any).message_id) },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    if (appMessage) {
      io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
    }
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const sendDocument = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.sendMedia(getToken(req), {
      chat_id: req.body.chat_id,
      mediaUrl: req.body.document,
      caption: req.body.caption,
      fileName: req.body.file_name,
      type: 'FILE',
    });
    const appMessage = await prisma.message.findUnique({
      where: { id: String((result.result as any).message_id) },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    if (appMessage) {
      io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
    }
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const sendVideo = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.sendMedia(getToken(req), {
      chat_id: req.body.chat_id,
      mediaUrl: req.body.video,
      caption: req.body.caption,
      fileName: req.body.file_name,
      type: 'VIDEO',
    });
    const appMessage = await prisma.message.findUnique({
      where: { id: String((result.result as any).message_id) },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    if (appMessage) {
      io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
    }
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const sendAudio = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.sendMedia(getToken(req), {
      chat_id: req.body.chat_id,
      mediaUrl: req.body.audio,
      caption: req.body.caption,
      fileName: req.body.file_name,
      type: 'AUDIO',
    });
    const appMessage = await prisma.message.findUnique({
      where: { id: String((result.result as any).message_id) },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    if (appMessage) {
      io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
    }
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const editMessageText = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.editMessageText(getToken(req), req.body);
    const appMessage = await prisma.message.findUnique({
      where: { id: String((result.result as any).message_id) },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    if (appMessage) {
      io.to(`chat:${req.body.chat_id}`).emit('message:update', appMessage);
    }
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const result = await botApiCompatibilityService.deleteMessage(getToken(req), req.body);
    io.to(`chat:${req.body.chat_id}`).emit('message:delete', { messageId: req.body.message_id });
    res.json(result);
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const answerCallbackQuery = async (req: Request, res: Response) => {
  try {
    const { callback_query_id: callbackQueryId, text } = req.body;
    res.json(await botApiCompatibilityService.answerCallbackQuery(getToken(req), callbackQueryId, text));
  } catch (error) {
    handleBotApiError(error, res);
  }
};

export const answerInlineQuery = async (req: Request, res: Response) => {
  try {
    const { inline_query_id: inlineQueryId, results } = req.body;
    res.json(await botApiCompatibilityService.answerInlineQuery(getToken(req), inlineQueryId, Array.isArray(results) ? results : []));
  } catch (error) {
    handleBotApiError(error, res);
  }
};
