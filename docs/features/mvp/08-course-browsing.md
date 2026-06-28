# Course Browsing

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Let students discover available published courses.

## Requirements
- Public course listing page
- Course detail page
- Search courses by title
- Filter courses by category
- Filter courses by level
- Sort courses by latest or popular
- Show course thumbnail, instructor, rating, level, and enrollment count

## Backend Scope
- Add public course listing API
- Add course detail API
- Support search, filter, and sorting query params

## Frontend Scope
- Build course listing page
- Build course detail page
- Add search, filters, and sorting controls

## Acceptance Checklist
- [x] Students can browse published courses
- [x] Search returns matching courses
- [x] Filters work correctly
- [x] Course detail page shows key information

## Current Implementation Notes
- Course listing and detail pages exist in `frontend/src/pages/courses/`.
- Backend supports public published course listing and text search.
- Level filter (`?level=beginner|intermediate|advanced`) wired to filter pill UI.
- Sort (`?sort=popular|free`, default=latest) implemented on both backend and frontend.
- CourseCard now shows a level badge overlay, enrollment count, and "Free" label for free courses.
- Backend `getCourses` now returns `enrollmentCount` per course.
