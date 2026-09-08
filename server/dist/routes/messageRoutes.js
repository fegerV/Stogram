"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateMessagesCache = void 0;
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const cache_1 = require("../middleware/cache");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Cache messages with chat-specific keys
router.get('/:chatId', cache_1.CacheMiddleware.cache({ ttl: 30, keyPrefix: 'messages' }), messageController_1.getMessages);
router.post('/:chatId', upload_1.upload.single('file'), messageController_1.sendMessage);
router.post('/:messageId/forward', messageController_1.forwardMessage);
router.post('/:messageId/read', messageController_1.markAsRead);
router.patch('/:messageId', messageController_1.editMessage);
router.delete('/:messageId', messageController_1.deleteMessage);
// Invalidate messages cache when messages are modified
const invalidateMessagesCache = async (chatId) => {
    await cache_1.CacheMiddleware.invalidate(`messages:*${chatId}*`);
};
exports.invalidateMessagesCache = invalidateMessagesCache;
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map