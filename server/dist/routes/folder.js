"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const folderController_1 = require("../controllers/folderController");
const router = express_1.default.Router();
router.get('/', auth_1.auth, folderController_1.getFolders);
router.post('/', auth_1.auth, folderController_1.createFolder);
router.put('/:folderId', auth_1.auth, folderController_1.updateFolder);
router.delete('/:folderId', auth_1.auth, folderController_1.deleteFolder);
router.post('/:folderId/chats/:chatId', auth_1.auth, folderController_1.addChatToFolder);
router.delete('/chats/:chatId', auth_1.auth, folderController_1.removeChatFromFolder);
exports.default = router;
//# sourceMappingURL=folder.js.map