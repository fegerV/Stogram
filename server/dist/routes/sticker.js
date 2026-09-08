"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const stickerController_1 = require("../controllers/stickerController");
const router = express_1.default.Router();
// Публичные роуты
router.get('/', stickerController_1.getStickerPacks);
router.get('/:slug', stickerController_1.getStickerPack);
// Защищенные роуты
router.post('/', auth_1.authenticate, stickerController_1.createStickerPack);
router.post('/:packId/stickers', auth_1.authenticate, stickerController_1.addStickerToPack);
router.delete('/stickers/:stickerId', auth_1.authenticate, stickerController_1.deleteSticker);
router.delete('/:packId', auth_1.authenticate, stickerController_1.deleteStickerPack);
exports.default = router;
//# sourceMappingURL=sticker.js.map