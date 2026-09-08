import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as enhancedBotService from '../services/enhancedBotService';
import { handleBadRequest, handleForbidden, handleNotFound, handleControllerError } from '../utils/errorHandlers';

/**
 * Enhanced Bot API Controller
 * Provides Telegram Bot API-like endpoints for advanced bot functionality
 */

// Parse message entities (mentions, hashtags, commands, URLs)
export const parseEntities = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return handleBadRequest(res, 'Text is required');
    }

    const entities = enhancedBotService.parseMessageEntities(text);
    res.json({ ok: true, result: { entities } });
  } catch (error) {
    handleControllerError(error, res, 'Failed to parse entities');
  }
};

// Send chat action (typing, upload_photo, etc.)
export const sendChatAction = async (req: AuthRequest, res: Response) => {
  try {
    const { botId, chatId, action } = req.body;

    if (!botId || !chatId || !action) {
      return handleBadRequest(res, 'botId, chatId, and action are required');
    }

    const validActions = [
      'typing',
      'upload_photo',
      'record_video',
      'upload_video',
      'record_audio',
      'upload_audio',
      'upload_document',
      'find_location',
      'record_video_note',
      'upload_video_note',
      'choose_sticker',
    ];

    if (!validActions.includes(action)) {
      return handleBadRequest(res, `Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    const success = await enhancedBotService.sendChatAction(botId, chatId, action);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Bot is not active or not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to send chat action');
  }
};

// Answer callback query (inline button clicks)
export const answerCallbackQuery = async (req: AuthRequest, res: Response) => {
  try {
    const { botId, callbackQueryId, text, show_alert, url, cache_time } = req.body;

    if (!botId || !callbackQueryId) {
      return handleBadRequest(res, 'botId and callbackQueryId are required');
    }

    const success = await enhancedBotService.answerCallbackQuery(botId, callbackQueryId, {
      text,
      show_alert,
      url,
      cache_time,
    });

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Bot installation not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to answer callback query');
  }
};

// Answer inline query
export const answerInlineQuery = async (req: AuthRequest, res: Response) => {
  try {
    const { botId, inlineQueryId, results, options } = req.body;

    if (!botId || !inlineQueryId || !results) {
      return handleBadRequest(res, 'botId, inlineQueryId, and results are required');
    }

    const success = await enhancedBotService.answerInlineQuery(botId, inlineQueryId, results, options);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Bot is not active or not inline' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to answer inline query');
  }
};

// Edit message text
export const editMessageText = async (req: AuthRequest, res: Response) => {
  try {
    const { botId, messageId, text, parse_mode, entities, reply_markup } = req.body;

    if (!botId || !messageId || !text) {
      return handleBadRequest(res, 'botId, messageId, and text are required');
    }

    const success = await enhancedBotService.editMessageText(botId, messageId, text, {
      parse_mode,
      entities,
      reply_markup,
    });

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Message not found or bot mismatch' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to edit message text');
  }
};

// Edit message reply markup (keyboard)
export const editMessageReplyMarkup = async (req: AuthRequest, res: Response) => {
  try {
    const { botId, messageId, reply_markup } = req.body;

    if (!botId || !messageId || !reply_markup) {
      return handleBadRequest(res, 'botId, messageId, and reply_markup are required');
    }

    const success = await enhancedBotService.editMessageReplyMarkup(botId, messageId, reply_markup);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Message not found or bot mismatch' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to edit message reply markup');
  }
};

// Delete message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { botId, messageId } = req.body;

    if (!botId || !messageId) {
      return handleBadRequest(res, 'botId and messageId are required');
    }

    const success = await enhancedBotService.deleteMessage(botId, messageId);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Message not found or bot mismatch' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to delete message');
  }
};

// Get chat administrators
export const getChatAdministrators = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return handleBadRequest(res, 'chatId is required');
    }

    const admins = await enhancedBotService.getChatAdministrators(chatId);
    res.json({ ok: true, result: admins });
  } catch (error) {
    handleControllerError(error, res, 'Failed to get chat administrators');
  }
};

// Get chat member count
export const getChatMemberCount = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return handleBadRequest(res, 'chatId is required');
    }

    const count = await enhancedBotService.getChatMemberCount(chatId);
    res.json({ ok: true, result: count });
  } catch (error) {
    handleControllerError(error, res, 'Failed to get chat member count');
  }
};

// Get chat member
export const getChatMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return handleBadRequest(res, 'chatId and userId are required');
    }

    const member = await enhancedBotService.getChatMember(chatId, userId);

    if (!member) {
      return res.json({ ok: false, error_code: 400, description: 'Member not found' });
    }

    res.json({ ok: true, result: member });
  } catch (error) {
    handleControllerError(error, res, 'Failed to get chat member');
  }
};

// Set chat permissions
export const setChatPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, permissions } = req.body;

    if (!chatId || !permissions) {
      return handleBadRequest(res, 'chatId and permissions are required');
    }

    const success = await enhancedBotService.setChatPermissions(chatId, permissions);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Chat not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to set chat permissions');
  }
};

// Kick chat member (ban/unban)
export const kickChatMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId, untilDate } = req.body;

    if (!chatId || !userId) {
      return handleBadRequest(res, 'chatId and userId are required');
    }

    const success = await enhancedBotService.kickChatMember(chatId, userId, untilDate ? new Date(untilDate) : undefined);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Member not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to kick chat member');
  }
};

// Unban chat member
export const unbanChatMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return handleBadRequest(res, 'chatId and userId are required');
    }

    const success = await enhancedBotService.unbanChatMember(chatId, userId);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Member not found or not banned' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to unban chat member');
  }
};

// Restrict chat member
export const restrictChatMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId, permissions } = req.body;

    if (!chatId || !userId || !permissions) {
      return handleBadRequest(res, 'chatId, userId, and permissions are required');
    }

    const success = await enhancedBotService.restrictChatMember(chatId, userId, permissions);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Member not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to restrict chat member');
  }
};

// Promote chat member
export const promoteChatMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId, permissions } = req.body;

    if (!chatId || !userId) {
      return handleBadRequest(res, 'chatId and userId are required');
    }

    const success = await enhancedBotService.promoteChatMember(chatId, userId, permissions || {});

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Member not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to promote chat member');
  }
};

// Export chat invite link
export const exportChatInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return handleBadRequest(res, 'chatId is required');
    }

    const inviteLink = await enhancedBotService.exportChatInviteLink(chatId);
    res.json({ ok: true, result: { inviteLink } });
  } catch (error: any) {
    if (error.message === 'Chat not found') {
      return handleNotFound(res, 'Chat');
    }
    handleControllerError(error, res, 'Failed to export chat invite link');
  }
};

// Create chat invite link
export const createChatInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, name, expireDate, memberLimit, creates_join_request } = req.body;

    if (!chatId) {
      return handleBadRequest(res, 'chatId is required');
    }

    const result = await enhancedBotService.createChatInviteLink(chatId, {
      name,
      expireDate: expireDate ? new Date(expireDate) : undefined,
      memberLimit,
      creates_join_request,
    });

    res.json({ ok: true, result });
  } catch (error: any) {
    if (error.message === 'Chat not found') {
      return handleNotFound(res, 'Chat');
    }
    handleControllerError(error, res, 'Failed to create chat invite link');
  }
};

// Revoke chat invite link
export const revokeChatInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, inviteCode } = req.body;

    if (!chatId || !inviteCode) {
      return handleBadRequest(res, 'chatId and inviteCode are required');
    }

    const success = await enhancedBotService.revokeChatInviteLink(chatId, inviteCode);

    if (!success) {
      return res.json({ ok: false, error_code: 400, description: 'Invite link not found' });
    }

    res.json({ ok: true, result: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to revoke chat invite link');
  }
};

// Build inline keyboard helper
export const buildInlineKeyboard = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return handleBadRequest(res, 'rows array is required');
    }

    const keyboard = enhancedBotService.buildInlineKeyboard(rows);
    res.json({ ok: true, result: keyboard });
  } catch (error) {
    handleControllerError(error, res, 'Failed to build inline keyboard');
  }
};

// Build reply keyboard helper
export const buildReplyKeyboard = async (req: AuthRequest, res: Response) => {
  try {
    const { rows, resize, oneTime } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return handleBadRequest(res, 'rows array is required');
    }

    const keyboard = enhancedBotService.buildReplyKeyboard(rows, {
      resize,
      oneTime,
    });
    res.json({ ok: true, result: keyboard });
  } catch (error) {
    handleControllerError(error, res, 'Failed to build reply keyboard');
  }
};
