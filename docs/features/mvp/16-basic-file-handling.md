# Basic File Handling

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Support course thumbnails and lesson resources safely.

## Requirements
- Instructors can upload an image for the course thumbnail
- Instructors can upload a PDF as a lesson item
- Store files securely on the server
- Do not bloat the database (store paths only)

## Backend Scope
- Add file upload middleware
- Validate file type (image and PDF)
- Validate file size
- Store file metadata or URL
- Remove files linked to deleted course content (Bonus, deferred)

## Frontend Scope
- Add thumbnail upload field
- Add PDF upload field

## Acceptance Checklist
- [x] Thumbnail upload works
- [x] PDF upload works
- [x] Invalid files are rejected
- [ ] Large files are rejected
- [ ] Stored file URLs are linked to course content

## Current Implementation Notes
- Added `multer` and `@types/multer` dependencies.
- Configured local storage under `backend/uploads/` via `uploadMiddleware.ts`.
- Created `/api/upload` route in `uploadRoutes.ts`.
- `server.ts` handles serving static files from `/uploads`.
- Replaced direct URL input with `FileUpload` component in `CreateCourse.tsx` and `EditCourse.tsx`.
