import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DOC_LIMITS } from '../../../shared/utils/mime';

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.resolve('uploads/requests');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (DOC_LIMITS.ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('UNSUPPORTED_FILE_TYPE'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: DOC_LIMITS.MAX_FILE_SIZE,
    files: 1, // Chỉ cho phép upload 1 file mỗi lần
  },
});

