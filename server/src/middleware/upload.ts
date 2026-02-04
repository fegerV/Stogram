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
  // Разрешенные расширения файлов
  const allowedExtensions = /\.(jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|txt)$/i;
  // Разрешенные MIME-типы
  const allowedMimeTypes = /^(image|video|audio|application|text)\//;
  
  const extname = allowedExtensions.test(path.extname(file.originalname));
  const mimetype = allowedMimeTypes.test(file.mimetype) || 
                   /^(image\/(jpeg|jpg|png|gif)|video\/(mp4|mov|avi)|audio\/(mp3|wav)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain)$/i.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    console.error('Invalid file type:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname)
    });
    cb(new Error('Invalid file type'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter,
});
