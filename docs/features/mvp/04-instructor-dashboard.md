# Instructor Dashboard

Status: Pending
Priority: MVP
Owner: Unassigned

## Goal
Give instructors a workspace to manage courses and view basic performance.

## Requirements
- View created courses
- See total enrollments per course
- See course publish status
- Create, edit, publish, unpublish, and delete courses
- Manage course lessons and resources

## Backend Scope
- Add instructor course summary endpoint
- Return enrollment counts and publish status
- Restrict data to the current instructor

## Frontend Scope
- Build instructor dashboard page
- Add course management actions
- Show status and enrollment metrics

## Acceptance Checklist
- [x] Instructor sees only their courses
- [ ] Enrollment count appears per course
- [x] Published and draft states are visible
- [x] Course actions are available from dashboard

## Current Implementation Notes
- Instructor dashboard and course list pages exist in `frontend/src/features/instructor/pages/`.
- Backend supports `GET /api/courses?mine=true`.
- Potential issue: frontend calls `/courses/:id/enrollments`, but the backend route appears to expose `/courses/:courseId/students`.
