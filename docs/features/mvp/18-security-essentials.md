# Security Essentials

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Cover the minimum security rules needed for a safe LMS demo.

## Requirements
- Hash passwords before saving
- Protect private APIs with auth middleware
- Check role permissions on backend routes
- Validate MongoDB IDs
- Prevent students from accessing unpublished courses
- Prevent instructors from editing courses they do not own
- Use environment variables for secrets

## Backend Scope
- Apply auth middleware to private routes
- Apply ownership checks to instructor routes
- Validate params and IDs
- Load secrets from environment variables

## Frontend Scope
- Do not expose private controls to unauthorized users
- Handle unauthorized responses cleanly

## Acceptance Checklist
- [x] Private APIs require auth
- [x] Role checks exist on sensitive APIs
- [x] Ownership checks protect instructor content
- [x] Secrets are not hardcoded
- [x] Unpublished content is not publicly accessible

## Current Implementation Notes
- Auth middleware, role middleware, ownership checks, and MongoDB ID validation are present in all controllers.
- `getCourseById` now checks enrollment or instructor status before returning `lessonItems` — non-enrolled users receive an empty array.
- Unpublished courses are gated to instructors/admins only (403 for others).
- Secrets are loaded via `dotenv` from `.env` files, never hardcoded.
- Frontend `ProtectedRoute` silently redirects unauthorized users to home; API returns `401`/`403` with descriptive messages.
- JWT token expiry standardised to `7d` for both registration and login to give users consistent session duration.
