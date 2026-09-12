import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadFile, deleteFile } from '../controllers/upload/uploadController';
import multer from 'multer';

const router = Router();

// Single file upload endpoint
router.post(
  '/',
  protect,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large. Maximum size is 100MB.' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadFile
);

// Delete file endpoint
router.delete('/', protect, deleteFile);

export default router;
