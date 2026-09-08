"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
    // Разрешённые расширения файлов (включая webm/ogg для голосовых сообщений)
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|ogg|mp3|wav|aac|m4a|pdf|doc|docx|txt|zip|rar)$/i;
    // Разрешённые MIME-типы (общий паттерн)
    const allowedMimeTypes = /^(image|video|audio|application|text)\//;
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const hasAllowedExtension = allowedExtensions.test(ext);
    const hasAllowedMimeType = allowedMimeTypes.test(file.mimetype);
    if (hasAllowedExtension && hasAllowedMimeType) {
        return cb(null, true);
    }
    // Разрешаем файлы без расширения, если MIME-тип валиден (для blob-ов)
    if (!ext && hasAllowedMimeType) {
        return cb(null, true);
    }
    console.error('Invalid file type:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: ext,
    });
    cb(new Error('Invalid file type'));
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    },
    fileFilter,
});
//# sourceMappingURL=upload.js.map