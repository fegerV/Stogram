"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const chatSettingsController_1 = require("../controllers/chatSettingsController");
const router = express_1.default.Router();
router.get('/:chatId', auth_1.auth, chatSettingsController_1.getChatSettings);
router.put('/:chatId', auth_1.auth, chatSettingsController_1.updateChatSettings);
router.post('/:chatId/mute', auth_1.auth, chatSettingsController_1.muteChat);
router.post('/:chatId/unmute', auth_1.auth, chatSettingsController_1.unmuteChat);
router.patch('/:chatId/notifications', auth_1.auth, chatSettingsController_1.updateNotificationLevel);
router.post('/:chatId/favorite', auth_1.auth, chatSettingsController_1.toggleFavorite);
router.put('/:chatId/unread', auth_1.auth, chatSettingsController_1.updateUnreadCount);
router.post('/:chatId/unread/reset', auth_1.auth, chatSettingsController_1.resetUnreadCount);
router.post('/:chatId/archive', auth_1.auth, chatSettingsController_1.archiveChat);
router.post('/:chatId/unarchive', auth_1.auth, chatSettingsController_1.unarchiveChat);
router.get('/archived/all', auth_1.auth, chatSettingsController_1.getArchivedChats);
exports.default = router;
//# sourceMappingURL=chatSettings.js.map