# Enrollment System

Status: Pending
Priority: MVP
Owner: Unassigned

## Goal
Allow students to enroll in published courses and unlock course learning content.

## Requirements
- Students can enroll in published courses
- Prevent duplicate enrollments
- Students can view enrollment status
- Students can unenroll from a course
- Instructors can see enrolled students for their courses
- Admin can see all enrollments

## Backend Scope
- Create enrollment model
- Add enroll API
- Add student enrollment list API
- Add instructor enrollment view for owned courses

## Frontend Scope
- Add enroll button on course detail page
- Show enrolled state
- Add unenroll option
- Build enrolled courses display
- Build instructor student list page

## Acceptance Checklist
- [x] Student can enroll in published course
- [x] Duplicate enrollment is blocked
- [x] Unpublished courses cannot be enrolled in
- [x] Enrolled courses appear on student dashboard
- [ ] Student can unenroll from a course
- [ ] Instructor can view enrolled students list
- [ ] Admin can view all enrollments

## Current Implementation Notes
- Enrollment model, routes, controller, frontend service, and enroll button exist.
- Instructor student list API exists, but frontend instructor student page currently uses mock data.
- Potential issue: instructor pages call `/courses/:id/enrollments`, but the registered route appears to be `/courses/:courseId/students`.
- Admin view of all enrollments is not implemented.
