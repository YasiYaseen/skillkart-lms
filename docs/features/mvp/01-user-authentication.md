# User Authentication

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Allow users to register, log in, log out, and access protected areas of SkillKart.

## Requirements
- User registration
- User login and logout
- Password hashing
- JWT-based authentication
- Protected routes for logged-in users
- Basic profile page
- Update profile details

## Backend Scope
- Create user model fields for name, email, password, role, and account status
- Add auth routes for register, login, logout, and current user
- Add password hashing before saving users
- Add JWT creation and verification

## Frontend Scope
- Build register page
- Build login page
- Store authenticated user state
- Protect private routes
- Build basic profile page

## Acceptance Checklist
- [x] User can register
- [x] User can log in
- [x] Password is hashed in database
- [x] JWT protects private APIs
- [x] Invalid credentials show clear error
- [x] User can view and update profile

## Current Implementation Notes
- Backend auth exists in `backend/src/routes/authRoutes.ts` and `backend/src/controllers/auth/authController.ts`.
- Google login and onboarding endpoints also exist.
- Frontend auth state exists in `frontend/src/features/auth/AuthContext.tsx`.
- Profile page exists at `/profile` (allows viewing and updating name).
- Invalid credentials properly trigger a toast error using the backend's explicit 400 responses.
