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
- Only `frontend/src/features/admin/index.ts` exists.
- No admin pages, admin routes, or admin controllers were found.
