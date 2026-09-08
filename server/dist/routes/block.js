"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const blockController_1 = require("../controllers/blockController");
const router = express_1.default.Router();
router.post('/:blockedId', auth_1.auth, blockController_1.blockUser);
router.delete('/:blockedId', auth_1.auth, blockController_1.unblockUser);
router.get('/', auth_1.auth, blockController_1.getBlockedUsers);
router.get('/check/:targetUserId', auth_1.auth, blockController_1.isUserBlocked);
exports.default = router;
//# sourceMappingURL=block.js.map