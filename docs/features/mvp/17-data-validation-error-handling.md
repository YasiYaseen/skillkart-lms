# Data Validation and Error Handling

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Keep API input safe and make errors understandable across the app.

## Requirements
- Validate all backend requests with Zod
- Return consistent error responses
- Show frontend form errors clearly
- Handle loading, empty, and error states in UI

## Backend Scope
- Add Zod validators for request bodies and query params
- Add shared validation middleware
- Use consistent JSON error format

## Frontend Scope
- Show field-level errors
- Show empty states
- Show loading states
- Show API failure messages

## Acceptance Checklist
- [x] Invalid API requests are rejected
- [x] Errors use consistent JSON shape
- [x] Forms show useful validation errors
- [x] Loading and empty states exist for main pages

## Current Implementation Notes
- Zod validators exist for course, enrollment, review, and now auth/section/lesson/lesson-item APIs.
- Created `validators/content.validator.ts` with schemas for `register`, `login`, `createSection`, `createLesson`, and `createLessonItem`.
- All validation errors now return consistent `{ message: "Validation failed", errors: { field: [...] } }` shape.
- Frontend auth modals display API error messages via toast.
- Loading and empty states exist on all main student, instructor, and course pages.
