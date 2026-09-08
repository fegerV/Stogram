"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateUserCache = void 0;
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const sessionController_1 = require("../controllers/sessionController");
const accountController_1 = require("../controllers/accountController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const cache_1 = require("../middleware/cache");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Cache user profile lookups (short TTL since status changes frequently)
router.get('/:userId', cache_1.CacheMiddleware.cache({ ttl: 60, keyPrefix: 'user' }), userController_1.getUserById);
// Cache current user with shorter TTL
router.get('/me', cache_1.CacheMiddleware.cache({ ttl: 30, keyPrefix: 'currentUser' }), userController_1.getCurrentUser);
// Search doesn't need caching (already limited to 20 results)
// Contacts can be cached for a bit longer
router.get('/contacts', cache_1.CacheMiddleware.cache({ ttl: 120, keyPrefix: 'contacts' }), userController_1.getContacts);
router.post('/contacts', userController_1.addContact);
router.delete('/contacts/:contactId', userController_1.removeContact);
router.get('/privacy', userController_1.getPrivacySettings);
router.patch('/privacy', userController_1.updatePrivacySettings);
router.get('/notifications', userController_1.getNotificationPreferences);
router.patch('/notifications', userController_1.updateNotificationPreferences);
router.patch('/profile', upload_1.upload.single('avatar'), userController_1.updateProfile);
router.post('/change-password', userController_1.changePassword);
router.post('/push-subscription', userController_1.subscribeToPush);
router.patch('/theme', userController_1.updateTheme);
router.get('/sessions', sessionController_1.getSessions);
router.delete('/sessions/:id', sessionController_1.revokeSession);
router.delete('/sessions', sessionController_1.revokeAllSessions);
router.get('/storage', accountController_1.getStorageInfo);
router.post('/storage/clear-cache', accountController_1.clearCache);
router.get('/export', accountController_1.exportData);
router.post('/import', accountController_1.importData);
// Export for cache invalidation
const invalidateUserCache = async (userId) => {
    await cache_1.CacheMiddleware.invalidate(`user:*${userId}*`);
};
exports.invalidateUserCache = invalidateUserCache;
exports.default = router;
//# sourceMappingURL=userRoutes.js.map