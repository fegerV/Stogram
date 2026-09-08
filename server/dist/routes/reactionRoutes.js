"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reactionController_1 = require("../controllers/reactionController");
const router = (0, express_1.Router)();
router.post('/messages/:messageId/reactions', auth_1.auth, reactionController_1.addReaction);
router.delete('/messages/:messageId/reactions/:emoji', auth_1.auth, reactionController_1.removeReaction);
router.get('/messages/:messageId/reactions', auth_1.auth, reactionController_1.getReactions);
exports.default = router;
//# sourceMappingURL=reactionRoutes.js.map