"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateChatCache = void 0;
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../middleware/cache");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Cache GET requests with user-specific keys
router.get('/', cache_1.CacheMiddleware.cache({ ttl: 30, keyPrefix: 'chats' }), chatController_1.getChats);
router.get('/:chatId', cache_1.CacheMiddleware.cache({ ttl: 60, keyPrefix: 'chat' }), chatController_1.getChatById);
router.post('/', chatController_1.createChat);
router.patch('/:chatId', chatController_1.updateChat);
router.delete('/:chatId', chatController_1.deleteChat);
router.post('/:chatId/members', chatController_1.addMember);
router.delete('/:chatId/members/:memberId', chatController_1.removeMember);
router.patch('/:chatId/pin', chatController_1.pinMessage);
router.delete('/:chatId/pin', chatController_1.unpinMessage);
// Invalidate chat cache when chat is updated
const invalidateChatCache = async (chatId) => {
    await cache_1.CacheMiddleware.invalidate(`chat:${chatId}*`);
};
exports.invalidateChatCache = invalidateChatCache;
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map