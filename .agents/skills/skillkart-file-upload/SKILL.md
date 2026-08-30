---
name: skillkart-file-upload
description: File upload system for SkillKart — multer configuration, allowed types, size limits, and how to use the upload middleware in routes.
---

# SkillKart File Upload Guidelines

Covers the multer-based file upload setup, allowed types, size limits, and how to wire it into routes.

---

## Overview

- **Middleware:** `backend/src/middleware/uploadMiddleware.ts`
- **Controller:** `backend/src/controllers/upload/uploadController.ts`
- **Routes:** `backend/src/routes/uploadRoutes.ts`
- **Storage location:** `backend/uploads/` (local disk)

---

## Configuration

```typescript
import { upload } from "../middleware/uploadMiddleware";

// Allowed MIME types
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Max file size: 15MB
// Filename: UUID + original extension (e.g. "a1b2c3d4-....jpg")
// Destination: uploads/ directory
```

---

## Using the Upload Middleware in Routes

```typescript
// Single file upload
router.post("/upload", protect, upload.single("file"), uploadFile);

// Multiple files
router.post("/upload/multiple", protect, upload.array("files", 5), uploadFiles);
```

The `file` field name in `upload.single("file")` must match the `FormData` key sent from the frontend.

---

## Accessing the Uploaded File in Controllers

```typescript
import type { Request, Response } from "express";

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // req.file.filename — UUID-based filename stored on disk
  // req.file.path    — full local path
  // req.file.mimetype
  // req.file.size

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl });
}
```

---

## Frontend Usage

Use `multipart/form-data` with Axios:

```typescript
const formData = new FormData();
formData.append("file", selectedFile);

const { data } = await axios.post("/api/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
// data.url = "/uploads/<uuid>.ext"
```

---

## Serving Uploaded Files

In `server.ts`, static files are served from the `uploads/` directory:

```typescript
import path from "path";
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
```

The returned URL (e.g., `/uploads/abc123.jpg`) is directly usable as a `<img src>` or file link.

---

## Key Rules

- Only JPEG, PNG, WEBP, and PDF are accepted — reject all other MIME types.
- Maximum file size is **15MB**. Multer will reject larger files with a 413 error.
- Filenames are always randomized with UUID — never use the original filename.
- Always check `req.file` is defined before accessing its properties in the controller.
- Do not store file metadata in MongoDB unless needed — just store the URL string on the relevant model.
- The `uploads/` folder is **not** committed to git (add to `.gitignore`).
