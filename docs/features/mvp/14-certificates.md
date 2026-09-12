# Certificates

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Generate a simple completion record when a student finishes a course.

## Requirements
- Generate a simple completion certificate
- Certificate includes student name, course name, instructor name, and completion date
- Student can view completed course certificate
- Admin or instructor can verify certificate details

## Backend Scope
- Create certificate model
- Generate certificate after course completion
- Add certificate lookup API

## Frontend Scope
- Build certificate view
- Link completed courses to certificate page

## Acceptance Checklist
- [x] Certificate is generated at course completion
- [x] Certificate includes correct details
- [x] Student can view certificate
- [x] Certificate can be verified by ID

## Current Implementation Notes
- Created `Certificate` model with auto-generated unique IDs.
- Added `/api/certificates` routes for fetching user certificates, claiming certificates, and verifying certificates publicly.
- `progressController` automatically issues certificates when course progress reaches 100%.
- Created `MyCertificatesPage` to list a student's certificates.
- Created `VerifyCertificatePage` as a beautiful public page for verification.
- Added `My Certificates` link to the main navigation header for students.

## Certificate Time Lock (Anti-Cheat Guard 3)

To prevent a student from enrolling and generating a verifiable certificate within seconds, certificates can be issued with a `heldUntil` hold timestamp.

### How It Works
- On course auto-completion, the backend sums `durationMinutes` across all course lessons to compute `totalCourseDurationMs`.
- `minimumRequiredMs = totalCourseDurationMs * 0.30` (30% of declared duration).
- If the student completed the course in less time than `minimumRequiredMs`, the Certificate document is created with `heldUntil = enrollment.enrolledAt + minimumRequiredMs`.
- Zero-duration courses (no declared `durationMinutes`) are not affected — `minimumRequiredMs` is 0.

### Enforcement
- `GET /api/certificates/verify/:certificateId` (public): returns `423 Locked` with `{ heldUntil }` if the hold is still active.
- `GET /api/certificates/me` (student): each certificate includes `isHeld: boolean` and `heldUntil: Date | null`.
- The completion modal in the LessonViewer shows an amber notice box: *"Certificate sharing unlocks on [date]"* when `certificateHeldUntil` is returned from the progress update response.

### Student Experience
- Enrollment status correctly shows "completed" immediately.
- The student can view and download their certificate PDF right away.
- Only the **public verification link** (`/certificates/verify/:id`) is temporarily locked.
- A genuine student who spent real time on the course will never see the hold (their enrollment age exceeds the 30% threshold).

