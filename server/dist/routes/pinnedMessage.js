"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pinnedMessageController_1 = require("../controllers/pinnedMessageController");
const router = express_1.default.Router();
router.post('/', auth_1.auth, pinnedMessageController_1.pinMessage);
router.delete('/:messageId/:chatId', auth_1.auth, pinnedMessageController_1.unpinMessage);
router.get('/chat/:chatId', auth_1.auth, pinnedMessageController_1.getPinnedMessages);
router.get('/all', auth_1.auth, pinnedMessageController_1.getAllPinnedMessages);
exports.default = router;
//# sourceMappingURL=pinnedMessage.js.map