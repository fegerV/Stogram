"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const enhancedBotController = __importStar(require("../controllers/enhancedBotController"));
const router = express_1.default.Router();
// Message entities
router.post('/parseEntities', auth_1.authenticate, enhancedBotController.parseEntities);
// Chat actions
router.post('/sendChatAction', auth_1.authenticate, enhancedBotController.sendChatAction);
// Callback queries (inline buttons)
router.post('/answerCallbackQuery', auth_1.authenticate, enhancedBotController.answerCallbackQuery);
// Inline queries
router.post('/answerInlineQuery', auth_1.authenticate, enhancedBotController.answerInlineQuery);
// Edit messages
router.post('/editMessageText', auth_1.authenticate, enhancedBotController.editMessageText);
router.post('/editMessageReplyMarkup', auth_1.authenticate, enhancedBotController.editMessageReplyMarkup);
// Delete messages
router.post('/deleteMessage', auth_1.authenticate, enhancedBotController.deleteMessage);
// Chat administration
router.post('/getChatAdministrators', auth_1.authenticate, enhancedBotController.getChatAdministrators);
router.post('/getChatMemberCount', auth_1.authenticate, enhancedBotController.getChatMemberCount);
router.post('/getChatMember', auth_1.authenticate, enhancedBotController.getChatMember);
router.post('/setChatPermissions', auth_1.authenticate, enhancedBotController.setChatPermissions);
// Member management
router.post('/kickChatMember', auth_1.authenticate, enhancedBotController.kickChatMember);
router.post('/unbanChatMember', auth_1.authenticate, enhancedBotController.unbanChatMember);
router.post('/restrictChatMember', auth_1.authenticate, enhancedBotController.restrictChatMember);
router.post('/promoteChatMember', auth_1.authenticate, enhancedBotController.promoteChatMember);
// Invite links
router.post('/exportChatInviteLink', auth_1.authenticate, enhancedBotController.exportChatInviteLink);
router.post('/createChatInviteLink', auth_1.authenticate, enhancedBotController.createChatInviteLink);
router.post('/revokeChatInviteLink', auth_1.authenticate, enhancedBotController.revokeChatInviteLink);
// Keyboard builders
router.post('/buildInlineKeyboard', auth_1.authenticate, enhancedBotController.buildInlineKeyboard);
router.post('/buildReplyKeyboard', auth_1.authenticate, enhancedBotController.buildReplyKeyboard);
exports.default = router;
//# sourceMappingURL=enhancedBot.js.map