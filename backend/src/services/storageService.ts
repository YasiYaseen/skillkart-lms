import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
  mimetype: string;
  size: number;
}

// S3 Client lazy initializer for Cloudflare R2
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  // Fail fast with clear error if credentials are missing
  const missing = [];
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucketName) missing.push('R2_BUCKET_NAME');

  if (missing.length > 0) {
    throw new Error(
      `[StorageService] STORAGE_PROVIDER is set to 'r2', but missing required environment variables: ${missing.join(', ')}. Please check your backend/.env file.`
    );
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });

  return r2Client;
}

/**
 * Uploads a file to Cloudflare R2 (or local disk for development).
 * @param file - Multer uploaded file object
 * @param folder - Destination folder/category (e.g. 'thumbnails', 'avatars', 'assignments')
 */
export async function uploadFile(file: Express.Multer.File, folder = 'thumbnails'): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${uuidv4()}${ext}`;
  const key = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

  // --- 1. Cloudflare R2 Upload ---
  if (provider === 'r2') {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicUrlBase = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

    if (!file.path || !fs.existsSync(file.path)) {
      throw new Error('Upload failed: temporary file path does not exist.');
    }

    try {
      const fileStream = fs.createReadStream(file.path);
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
        ContentLength: file.size,
      });

      await client.send(command);
    } finally {
      // Always remove temporary file from local disk after uploading to R2
      await fs.promises.unlink(file.path).catch(() => {});
    }

    const domain = publicUrlBase || `https://${bucket}.r2.dev`;
    const url = `${domain}/${key}`;

    return {
      url,
      key,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  // --- 2. Local Disk Storage (Development) ---
  const uploadsBase = path.join(process.cwd(), 'uploads');
  const targetDir = cleanFolder ? path.join(uploadsBase, cleanFolder) : uploadsBase;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, fileName);

  if (file.path && fs.existsSync(file.path)) {
    await fs.promises.rename(file.path, targetPath).catch(async () => {
      await fs.promises.copyFile(file.path, targetPath);
      await fs.promises.unlink(file.path).catch(() => {});
    });
  } else if (file.buffer) {
    await fs.promises.writeFile(targetPath, file.buffer);
  } else {
    throw new Error('Upload failed: no file data found.');
  }

  const relativeUrl = cleanFolder ? `/uploads/${cleanFolder}/${fileName}` : `/uploads/${fileName}`;

  return {
    url: relativeUrl,
    key,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

/**
 * Deletes a file from Cloudflare R2 (or local disk).
 * Safely ignores external third-party URLs (e.g. Unsplash images, avatars).
 * @param fileKeyOrUrl - Storage key or public URL of the file to delete
 */
export async function deleteFile(fileKeyOrUrl: string): Promise<void> {
  if (!fileKeyOrUrl || typeof fileKeyOrUrl !== 'string') return;

  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  let key = fileKeyOrUrl.trim();

  // If a full HTTP/HTTPS URL is passed
  if (key.startsWith('http://') || key.startsWith('https://')) {
    const bucket = process.env.R2_BUCKET_NAME || '';
    const publicUrl = process.env.R2_PUBLIC_URL || '';

    // If it's a 3rd party URL (like images.unsplash.com or ui-avatars.com), skip deletion
    const isOurCloudUrl =
      (publicUrl && key.startsWith(publicUrl)) ||
      (bucket && key.includes(`${bucket}.r2.dev`)) ||
      (bucket && key.includes(`${bucket}.r2.cloudflarestorage.com`));

    if (provider === 'r2' && !isOurCloudUrl) {
      return;
    }

    try {
      const parsed = new URL(key);
      key = parsed.pathname.replace(/^\/+/, '');
    } catch {
      return;
    }
  } else if (key.startsWith('/uploads/')) {
    key = key.replace(/^\/uploads\//, '');
  }

  // Cloudflare R2 Deletion
  if (provider === 'r2') {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return;
  }

  // Local Disk Deletion
  const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
  const localPath = path.join(process.cwd(), 'uploads', safeKey);

  if (fs.existsSync(localPath)) {
    await fs.promises.unlink(localPath).catch(() => {});
  }
}

export const storageService = {
  uploadFile,
  deleteFile,
  upload: uploadFile,
  delete: deleteFile,
};

export default storageService;
