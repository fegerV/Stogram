import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Разрешённые расширения файлов (включая webm/ogg для голосовых сообщений)
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|ogg|mp3|wav|aac|m4a|pdf|doc|docx|txt|zip|rar)$/i;
  // Разрешённые MIME-типы (общий паттерн)
  const allowedMimeTypes = /^(image|video|audio|application|text)\//;
  
  const ext = path.extname(file.originalname).toLowerCase();
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

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter,
});
