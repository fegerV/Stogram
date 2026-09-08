"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const searchController_1 = require("../controllers/searchController");
const cache_1 = require("../middleware/cache");
const router = express_1.default.Router();
// Search endpoints - don't cache results as they're user-specific and dynamic
router.get('/messages', auth_1.auth, searchController_1.searchMessages);
router.get('/hashtag/:hashtag', auth_1.auth, searchController_1.searchByHashtag);
router.get('/mentions/:username?', auth_1.auth, searchController_1.searchByMention);
// Search history endpoints - cache for a short time
router.get('/history', cache_1.CacheMiddleware.cache({ ttl: 30, keyPrefix: 'searchHistory' }), auth_1.auth, searchController_1.getSearchHistory);
router.delete('/history', auth_1.auth, searchController_1.clearSearchHistory);
router.delete('/history/:historyId', auth_1.auth, searchController_1.deleteSearchHistoryItem);
exports.default = router;
//# sourceMappingURL=search.js.map