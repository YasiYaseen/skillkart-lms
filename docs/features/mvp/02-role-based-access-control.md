# Role-Based Access Control

Status: Pending
Priority: MVP
Owner: Unassigned

## Goal
Restrict pages and API actions based on whether the user is a student, instructor, or admin.

## Requirements
- Student role
- Instructor role
- Admin role
- Route protection by role
- Students can enroll and learn
- Instructors can create and manage their own courses
- Admins can manage users, courses, and platform settings

## Backend Scope
- Add role field to user model
- Add authorization middleware
- Apply role checks to protected routes

## Frontend Scope
- Hide unauthorized navigation items
- Redirect unauthorized users
- Show role-specific dashboards

## Acceptance Checklist
- [x] Student cannot create courses
- [x] Instructor cannot manage users
- [x] Instructor cannot edit another instructor's course
- [ ] Admin can access admin controls
- [ ] Unauthorized users receive clear errors

## Current Implementation Notes
- Backend role middleware exists in `backend/src/middleware/roleMiddleware.ts`.
- Frontend protected routing exists in `frontend/src/components/common/ProtectedRoute.tsx`.
- Instructor/admin route protection is used for course creation and instructor pages.
- Admin-specific controls are not implemented yet.
