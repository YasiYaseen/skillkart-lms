import type { Request, Response } from 'express';
import { uploadFile as storeFile, deleteFile as removeFile } from '../../services/storageService';

/**
 * POST /api/upload
 * Handles file upload using storageService (Cloudflare R2 or local disk).
 */
export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const folder = (req.body.folder as string) || 'thumbnails';
    const result = await storeFile(req.file, folder);

    return res.status(200).json({
      message: 'File uploaded successfully',
      url: result.url,
      key: result.key,
      filename: result.filename,
      mimetype: result.mimetype,
      size: result.size,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error during upload';
    console.error('Upload error:', error);
    return res.status(500).json({ message });
  }
}

/**
 * DELETE /api/upload
 * Deletes a file by key or URL.
 */
export async function deleteFile(req: Request, res: Response) {
  try {
    const key = (req.body.key || req.query.key) as string;
    if (!key) {
      return res.status(400).json({ message: 'File key or URL is required to delete' });
    }

    await removeFile(key);

    return res.status(200).json({ message: 'File deleted successfully', key });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error during deletion';
    console.error('Delete error:', error);
    return res.status(500).json({ message });
  }
}
