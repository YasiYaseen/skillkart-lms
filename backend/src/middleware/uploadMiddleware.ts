import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

// Define storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter (images, videos, audio, and documents)
const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Documents & Archives
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
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
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.pdf', '.doc', '.docx', '.zip', '.txt',
  '.mp4', '.webm', '.mov', '.mkv', '.ogg',
  '.mp3', '.wav', '.m4a'
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: Images, PDFs, Docs (.doc, .docx), Zip, Audio, and Video files (.mp4, .webm, .mov, .mkv).'));
  }
};

// Setup multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});
