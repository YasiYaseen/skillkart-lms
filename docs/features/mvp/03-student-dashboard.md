# Student Dashboard

Status: In Progress
Priority: MVP
Owner: Unassigned

## Goal
Give students a central place to continue courses and track learning.

## Requirements
- View enrolled courses
- Continue learning from the last lesson
- See course progress percentage
- See completed courses
- View recommended or latest courses

## Backend Scope
- Add endpoint for student dashboard summary
- Return enrollments, progress, and last accessed lesson

## Frontend Scope
- Build student dashboard page
- Display enrolled course cards
- Add continue learning action
- Show progress indicators

## Acceptance Checklist
- [x] Student sees enrolled courses
- [x] Student sees progress per course
- [ ] Continue button opens last lesson
- [ ] Completed courses are clearly marked

## Current Implementation Notes
- Student enrolled courses page exists at `frontend/src/features/student/pages/MyCourses.tsx`.
- Enrollment cards and progress UI exist under `frontend/src/features/enrollment/components/`.
- Missing or unclear: full dashboard summary, recommendations/latest courses, and polished completed-course grouping.
