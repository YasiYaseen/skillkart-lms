# Security Essentials

Status: Pending
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
- [ ] Unpublished content is not publicly accessible

## Current Implementation Notes
- Auth middleware, role middleware, ownership checks, and MongoDB ID validation are present in several controllers.
- Important gap: published course detail currently includes full lesson items without checking enrollment.
- `checkEnrollment` middleware exists but is not wired into the course detail or curriculum routes.
- Need a focused security pass before marking this feature done.
