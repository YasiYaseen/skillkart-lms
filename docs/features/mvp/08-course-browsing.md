# Course Browsing

Status: In Progress
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
- [ ] Filters work correctly
- [x] Course detail page shows key information

## Current Implementation Notes
- Course listing and detail pages exist in `frontend/src/pages/courses/`.
- Backend supports public published course listing and text search.
- Missing or unclear: category filter, level filter UI, popular sorting, real ratings, and enrollment count display.
