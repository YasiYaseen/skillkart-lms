# Course Content Structure

Status: Pending
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
- [ ] Lessons support text, video link, PDF, and resource URL end to end

## Current Implementation Notes
- Section, lesson, and lesson item models/controllers exist.
- Backend `LessonItem` supports `video`, `text`, `pdf`, `link`, `code`, and `quiz_block`.
- Instructor create course flow currently exposes video URL and text items only.
- Learner UI currently renders video and text items only.
