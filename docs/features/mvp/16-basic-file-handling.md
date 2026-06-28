# Basic File Handling

Status: Not Started
Priority: MVP
Owner: Unassigned

## Goal
Support course thumbnails and lesson resources safely.

## Requirements
- Upload course thumbnails
- Upload PDF resources
- Validate file type and size
- Store file URL in database
- Delete unused files when course content is removed

## Backend Scope
- Add file upload middleware
- Validate image and PDF uploads
- Store file metadata or URL
- Remove files linked to deleted course content

## Frontend Scope
- Add thumbnail upload field
- Add PDF resource upload field
- Show upload progress or loading state

## Acceptance Checklist
- [ ] Thumbnail upload works
- [ ] PDF upload works
- [ ] Invalid file types are rejected
- [ ] Large files are rejected
- [ ] Stored file URLs are linked to course content

## Current Implementation Notes
- Course thumbnails are currently handled as URL strings.
- No upload middleware or PDF upload flow was found.
