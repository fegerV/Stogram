import express from 'express';
import { authenticate } from '../middleware/auth';
import * as enhancedBotController from '../controllers/enhancedBotController';

const router = express.Router();

// Message entities
router.post('/parseEntities', authenticate, enhancedBotController.parseEntities);

// Chat actions
router.post('/sendChatAction', authenticate, enhancedBotController.sendChatAction);

// Callback queries (inline buttons)
router.post('/answerCallbackQuery', authenticate, enhancedBotController.answerCallbackQuery);

// Inline queries
router.post('/answerInlineQuery', authenticate, enhancedBotController.answerInlineQuery);

// Edit messages
router.post('/editMessageText', authenticate, enhancedBotController.editMessageText);
router.post('/editMessageReplyMarkup', authenticate, enhancedBotController.editMessageReplyMarkup);

// Delete messages
router.post('/deleteMessage', authenticate, enhancedBotController.deleteMessage);

// Chat administration
router.post('/getChatAdministrators', authenticate, enhancedBotController.getChatAdministrators);
router.post('/getChatMemberCount', authenticate, enhancedBotController.getChatMemberCount);
router.post('/getChatMember', authenticate, enhancedBotController.getChatMember);
router.post('/setChatPermissions', authenticate, enhancedBotController.setChatPermissions);

// Member management
router.post('/kickChatMember', authenticate, enhancedBotController.kickChatMember);
router.post('/unbanChatMember', authenticate, enhancedBotController.unbanChatMember);
router.post('/restrictChatMember', authenticate, enhancedBotController.restrictChatMember);
router.post('/promoteChatMember', authenticate, enhancedBotController.promoteChatMember);

// Invite links
router.post('/exportChatInviteLink', authenticate, enhancedBotController.exportChatInviteLink);
router.post('/createChatInviteLink', authenticate, enhancedBotController.createChatInviteLink);
router.post('/revokeChatInviteLink', authenticate, enhancedBotController.revokeChatInviteLink);

// Keyboard builders
router.post('/buildInlineKeyboard', authenticate, enhancedBotController.buildInlineKeyboard);
router.post('/buildReplyKeyboard', authenticate, enhancedBotController.buildReplyKeyboard);

export default router;
