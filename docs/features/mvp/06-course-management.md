# Course Management

Status: Pending
Priority: MVP
Owner: Unassigned

## Goal
Allow instructors to create and manage course records.

## Requirements
- Create courses
- Edit course details
- Delete courses
- Publish and unpublish courses
- Add course thumbnail
- Add course title, description, level, category, duration, and instructor
- Mark course as draft or published
- Show only published courses to students

## Backend Scope
- Create course model
- Add instructor-owned course CRUD APIs
- Add publish status handling
- Validate course request bodies

## Frontend Scope
- Build course create form
- Build course edit form
- Build instructor course list
- Add publish and unpublish controls

## Acceptance Checklist
- [x] Instructor can create course
- [ ] Instructor can edit own course
- [ ] Instructor can delete own course
- [x] Draft courses are hidden from students
- [x] Published courses appear in browse page

## Current Implementation Notes
- Backend course CRUD exists in `backend/src/controllers/course/courseController.ts`.
- Instructor course creation UI exists in `frontend/src/features/instructor/pages/CreateCourse.tsx`.
- Missing: edit/delete UI, category support, and real thumbnail upload.
- Potential issue: frontend course creation sends `level: 'all'`, but backend accepts only `beginner`, `intermediate`, or `advanced`.
