# Admin Dashboard

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Give admins a control panel for platform-wide user and course management.

## Requirements
- View total users, students, instructors, and courses
- View all registered users
- Enable or disable user accounts
- View all courses
- Enable, disable, approve, or reject courses
- Monitor basic platform activity

## Backend Scope
- Add admin summary endpoint
- Add user management APIs
- Add course moderation APIs

## Frontend Scope
- Build admin dashboard page
- Build user management table
- Build course moderation table

## Acceptance Checklist
- [x] Admin sees platform stats
- [x] Admin can enable or disable users
- [x] Admin can enable, disable, approve, or reject courses
- [x] Non-admin users cannot access admin APIs

## Current Implementation Notes
- Backend admin routes and controller exist at `backend/src/routes/adminRoutes.ts` and `backend/src/controllers/admin/adminController.ts` (protected by `protect` and `authorize("admin")`).
- Endpoints provided:
  - `GET /api/admin/stats` - Platform stats (total users, students, instructors, courses, enrollments).
  - `GET /api/admin/users` - Registered users list.
  - `PATCH /api/admin/users/:userId/status` - Toggle user active/disabled status.
  - `GET /api/admin/courses` - All platform courses with instructor metadata.
  - `PATCH /api/admin/courses/:courseId/status` - Update course active and approval status.
  - `GET /api/admin/enrollments` - All platform enrollments.
- Frontend admin feature exists at `frontend/src/features/admin/`:
  - `AdminLayout.tsx`: Dedicated sidebar navigation layout for admins.
  - `AdminDashboard.tsx`: Overview metric cards linking to management pages.
  - `UserManagement.tsx`: User list table with real-time enable/disable status toggling.
  - `CourseModeration.tsx`: Course moderation table with approve/reject and enable/disable controls.
  - `EnrollmentList.tsx`: Complete platform enrollment history table.
- Added "Admin Panel" link in the main navigation `Header.tsx` for admin users.
- Feature is fully implemented and tested.
