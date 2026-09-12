---
name: skillkart-file-upload
description: File upload system for SkillKart — Cloudflare R2 cloud storage and local development fallback via storageService.
---

# SkillKart File Upload Guidelines

Covers the file upload setup using Multer and `storageService.ts` for Cloudflare R2 and local development.

---

## Overview

- **Service:** `backend/src/services/storageService.ts` (Handles Cloudflare R2 and local disk storage)
- **Middleware:** `backend/src/middleware/uploadMiddleware.ts` (Multer fileFilter, 100MB limit, temp disk storage)
- **Controller:** `backend/src/controllers/upload/uploadController.ts`
- **Routes:** `backend/src/routes/uploadRoutes.ts` (`POST /api/upload`, `DELETE /api/upload`)

---

## How It Works

1. **Frontend (React)** sends multipart/form-data to `POST /api/upload`.
2. **Multer middleware** accepts the file (Images, PDFs, Docs, Audio, Video up to 100MB) and temporarily places it in `uploads/temp`.
3. **`uploadController`** calls `storageService.uploadFile(file, folder)`.
4. If `STORAGE_PROVIDER=r2`:
   - Uploads to Cloudflare R2 using `@aws-sdk/client-s3` (`PutObjectCommand`).
   - Removes the temporary local file immediately.
   - Returns the full public cloud URL (e.g. `https://pub-xxxx.r2.dev/thumbnails/uuid.jpg` or custom domain).
5. If `STORAGE_PROVIDER=local`:
   - Moves the file to `uploads/<folder>/` for local development.
   - Returns `/uploads/<folder>/<filename>`.
6. Stored in MongoDB: Just the URL string (e.g. `thumbnailUrl: "https://..."`).

---

## Environment Variables

```env
# Storage selection: 'local' or 'r2'
STORAGE_PROVIDER=local

# Cloudflare R2 Configuration (required when STORAGE_PROVIDER=r2)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=skillkart-bucket
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxx.r2.dev
```

If `STORAGE_PROVIDER=r2` and any of the credentials are missing, `storageService` fails fast with a clear descriptive error instead of silently falling back.

---

## File Deletion

When a course, user avatar, or document is deleted:
```typescript
import { deleteFile } from "../services/storageService";

await deleteFile(fileUrlOrKey);
```
This safely deletes the object from R2 (or unlinks the local file in development).
