# Data Validation and Error Handling

Status: Pending
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
- [ ] Errors use consistent JSON shape
- [ ] Forms show useful validation errors
- [x] Loading and empty states exist for main pages

## Current Implementation Notes
- Zod validators exist for course and enrollment APIs.
- Many controllers return `{ message }`, but error response shape is not fully unified.
- Some frontend pages show loading and empty states.
- Auth, quiz, section, lesson, and lesson item endpoints still use mostly manual validation.
