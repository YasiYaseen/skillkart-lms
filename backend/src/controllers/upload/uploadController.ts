import type { Request, Response } from 'express';

export function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct the public URL for the file
    // Assumes backend is running on the same domain or an accessible API domain
    const fileUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Server error during upload' });
  }
}
