# Course Content Structure

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Organize courses into sections and lessons that students can follow in order.

## Requirements
- Courses contain ordered sections or modules
- Sections contain ordered lessons
- Lessons support text content
- Lessons support video links
- Lessons support PDF or file resources
- Lessons have title, description, duration, and display order

## Backend Scope
- Create section model
- Create lesson model
- Add CRUD APIs for sections and lessons
- Add ordering support

## Frontend Scope
- Build section manager
- Build lesson editor
- Allow reorder-friendly display

## Acceptance Checklist
- [x] Instructor can add sections
- [x] Instructor can add lessons inside sections
- [x] Lessons display in correct order
- [x] Lessons support text, video link, PDF, and resource URL end to end

## Current Implementation Notes
- Section, lesson, and lesson item models/controllers exist.
- Backend `LessonItem` supports `video`, `text`, `pdf`, `link`, `code`, and `quiz_block`.
- Instructor lesson content editor now exposes 🎬 Video URL, 📝 Text/Notes, 🔗 External Link, and 📄 PDF URL item types.
- Learner `LessonViewer` now renders all four types: video/YouTube embeds, text notes, external link cards, and embedded PDF iframes.
- Feature is fully implemented.
