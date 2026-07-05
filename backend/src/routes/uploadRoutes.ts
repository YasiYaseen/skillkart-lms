import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadFile } from '../controllers/upload/uploadController';

const router = Router();

// Only authenticated users can upload files
router.post('/', protect, upload.single('file'), uploadFile);

export default router;
