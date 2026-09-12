# Progress Tracking

Status: Done
Priority: MVP
Owner: Yaseen

## Goal
Track how much of a course each student has completed.

## Requirements
- Track completed lessons
- Calculate course completion percentage
- Save last accessed lesson
- Mark course as completed when all lessons are completed
- Show progress on student dashboard and course page

## Backend Scope
- Create progress model
- Add mark lesson complete API
- Add last accessed lesson tracking
- Add completion percentage calculation

## Frontend Scope
- Show progress bars
- Show last accessed lesson
- Update progress after lesson completion

## Acceptance Checklist
- [x] Completed lessons are saved
- [x] Progress percentage is accurate
- [x] Last accessed lesson is saved
- [x] Course becomes complete at 100 percent
- [x] Progress bar is shown on student dashboard and course card

## Current Implementation Notes
- Status: Fully complete.
- We have synchronized the progress updates across `LessonProgress` and `Enrollment` models.
- Fixed the `lastAccessedLessonId` schema attribute lookup bug.
- Consolidated the course auto-completion check logic inside `updateLessonProgress` to ensure completing all lessons marks the course enrollment as `"completed"` automatically.
- Keeping `LessonProgress` in sync when updates occur via enrollment patch updates as well.

## Anti-Cheat Guards (Instant Completion Glitch Fix)

Three layered guards prevent students from clicking through an entire course and getting a certificate in seconds.

### Guard 1 — 80% Video Watch Threshold
- `LessonProgress` now stores `watchedSeconds: number` (default 0). Updated via `$max` so it only ever increases.
- When `wantsComplete === true` and `lesson.type === "video"` and `durationMinutes > 0`, the backend requires `watchedSeconds ≥ durationMinutes * 60 * 0.8` (80%).
- Returns `403` with `{ watchThresholdSeconds, watchedSeconds }` if not met.
- Non-video lesson types (article, quiz, assignment) are unaffected.
- Frontend tracks time via native `<video>` `onTimeUpdate` and YouTube IFrame postMessage (`enablejsapi=1`). On `403`, shows a friendly info toast, not an error.

### Guard 2 — Per-Lesson Completion Cooldown (30 seconds)
- On any `wantsComplete` request, the backend checks if any other lesson in this enrollment has `completedAt >= now - 30s`.
- Re-marking the current lesson (already completed) is excluded from the cooldown check.
- Returns `429` with `{ retryAfterMs }` if within cooldown window.
- Frontend shows a pacing toast: *"Great progress! Continue in Xs — there's no rush."*

### Guard 3 — Enrollment-to-Certificate Time Lock (see Certificates doc)
- On auto-completion, computes `totalCourseDurationMs` by summing all lesson `durationMinutes`.
- If `enrollmentAgeMs < totalCourseDurationMs * 0.3`, the Certificate is created with `heldUntil = enrolledAt + minimumRequiredMs`.
- The response includes `certificateHeldUntil` so the frontend can display a notice in the completion modal.
- Legitimate students who spent real time are unaffected (hold only triggers for implausibly fast completions).

### Validator
`progressUpdateSchema` in `content.validator.ts` documents the full accepted body shape including the new `watchedSeconds?: number` field.

