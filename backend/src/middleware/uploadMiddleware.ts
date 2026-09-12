import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

// Ensure temp upload directory exists
const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Store incoming files in uploads/temp before routing through storageService
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter (images, videos, audio, and documents/archives)
const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/ogg',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/ogg',
  'audio/webm',
];

const allowedExtensions = [
  // Images
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  // Documents
  '.pdf', '.doc', '.docx', '.txt', '.csv', '.ppt', '.pptx', '.xls', '.xlsx',
  // Archives
  '.zip', '.tar', '.gz', '.rar', '.7z',
  // Videos
  '.mp4', '.webm', '.mov', '.mkv', '.ogg',
  // Audio
  '.mp3', '.wav', '.m4a'
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: Images, PDFs, Documents, Archives (.zip, .rar, .tar, .7z), Audio, and Video files.'));
  }
};

// Setup multer with 100MB max limit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});
