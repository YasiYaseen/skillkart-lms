# Student Dashboard

Status: Done
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
- [x] Continue button opens last lesson
- [x] Completed courses are clearly marked

## Current Implementation Notes
- Student enrolled courses page exists at `frontend/src/features/student/pages/MyCourses.tsx`.
- Enrollment cards and progress UI exist under `frontend/src/features/enrollment/components/`.
- MyCourses page now splits In Progress vs Completed courses into labelled sections.
- EnrollmentCard resumes from `lastAccessedLessonId` when clicking Continue Learning.
- Completed courses display a green badge, green progress bar, and a "Review Course" CTA.
