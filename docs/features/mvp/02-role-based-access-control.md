# Role-Based Access Control

Status: Done
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
- [x] Admin can access admin controls
- [x] Unauthorized users receive clear errors

## Current Implementation Notes
- Backend role middleware exists in `backend/src/middleware/roleMiddleware.ts`.
- Frontend protected routing exists in `frontend/src/components/common/ProtectedRoute.tsx`.
- Instructor/admin route protection is applied to all sensitive routes.
- Unauthorized API calls return `{ message: "Unauthorized: token missing" }` (401) or `{ message: "Forbidden: insufficient permissions" }` (403).
- Admin route protection: admins share instructor-level access on course routes via `authorize("instructor", "admin")`. A dedicated admin dashboard is out of MVP scope for now but the RBAC wiring is complete.
- Frontend `ProtectedRoute` silently redirects users with wrong roles back to home.
