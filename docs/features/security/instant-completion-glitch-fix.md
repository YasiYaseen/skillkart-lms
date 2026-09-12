# Instant Completion Glitch Fix

Status: Done
Priority: Integrity / Security
Owner: Yaseen

## Problem

A student could enroll in a 40-hour video course, never play a single video, immediately click "Mark as Complete" on every lesson, and generate an official verifiable completion certificate within 60 seconds.

This undermined the credibility of all SkillKart certificates.

## Solution

Three independent, layered guards added to `updateLessonProgress` in `progressController.ts` and the `LessonViewer.tsx` frontend component.

---

## Guard 1 — 80% Video Watch Threshold

**Problem it solves:** Clicking "Mark as Complete" on a video lesson without watching it.

**Threshold:** `watchedSeconds >= floor(durationMinutes * 60 * 0.8)`

**Backend:**
- `LessonProgress` model gains `watchedSeconds: number` (default 0).
- Updated with MongoDB `$max` operator (monotonically increasing — no rewind exploits).
- When `wantsComplete === true` and `lesson.type === "video"` and `durationMinutes > 0`:
  - `effectiveWatchedSeconds = max(incomingWatchedSeconds, storedWatchedSeconds)`
  - If `effectiveWatchedSeconds < requiredSeconds` → `403 { message, watchThresholdSeconds, watchedSeconds }`
- Only applies to `video` type lessons. Articles, quizzes, and assignments are unaffected.

**Frontend (`LessonViewer.tsx`):**
- Native `<video>` element: `onTimeUpdate` updates `watchedSecondsRef.current`.
- YouTube/Vimeo `<iframe>`: `enablejsapi=1` added to YouTube src; `window.addEventListener('message')` picks up YouTube IFrame API `infoDelivery` events with `currentTime`.
- `handleProgress()` always sends `{ completed: true, watchedSeconds: watchedSecondsRef.current }`.
- On `403` with `watchThresholdSeconds`: info toast ("Watch at least X more minutes") — not an error toast.

---

## Guard 2 — Per-Lesson Completion Cooldown (30 seconds)

**Problem it solves:** Batch-clicking 40 lessons in 10 seconds.

**Threshold:** 30 seconds between distinct lesson completions in the same enrollment.

**Backend:**
- When `wantsComplete === true`, computes `eligibleCompletedIds` (all already-completed lesson IDs excluding the current lesson).
- Queries `LessonProgress` for any eligible lesson with `completedAt >= now - 30_000ms`.
- If found -> `429 { message, retryAfterMs }`.
- Re-marking the current lesson (e.g., a student clicking "Update" on an already-complete lesson) is excluded — no false positives.

**Frontend:**
- On `429`: info toast ("Great progress! Continue in Xs — there's no rush."), duration = `retryAfterMs`.

---

## Guard 3 — Enrollment-to-Certificate Time Lock

**Problem it solves:** Generating a verifiable public certificate minutes after enrolling in a 40-hour course.

**Threshold:** Enrollment must be at least 30% of the course's total declared duration old before the certificate becomes publicly verifiable.

**Backend (inside auto-completion chain):**
1. Sum `durationMinutes` across all course lessons -> `totalCourseDurationMs`
2. `minimumRequiredMs = floor(totalCourseDurationMs * 0.3)` (zero if course has no declared duration)
3. If `(completedAt - enrolledAt) < minimumRequiredMs`:
   - Certificate is **created** with `heldUntil = enrolledAt + minimumRequiredMs`
   - Response includes `certificateHeldUntil: Date`
4. Once `heldUntil` passes, the certificate verifies normally — no manual action needed.

**Enforcement:**
- `GET /api/certificates/verify/:certificateId` -> `423 Locked` with `{ heldUntil }` while held.
- `GET /api/certificates/me` -> each cert includes `isHeld: boolean` and `heldUntil: Date | null`.

**Frontend (completion modal):**
- If `certificateHeldUntil` is returned, an amber notice box shows in the completion modal:
  "Certificate sharing unlocks on [date]"
- Student is not denied their completion state or cert download.

---

## Why These Three, in This Order

| Guard | Stops | Student friction |
|---|---|---|
| Video watch threshold | Can't click complete without watching | None if you actually watch |
| 30s cooldown | Can't batch-click all lessons instantly | Barely noticeable for genuine students |
| Certificate time lock | Can't share a verifiable cert 60s after enrolling | None for genuine students |

Each guard is independent. Disabling one does not affect the others.

## Acceptance Checklist

- [x] Clicking complete on a video lesson without watching returns `403` with clear message
- [x] Watching >= 80% of video enables completion
- [x] Completing two lessons within 30s returns `429` with `retryAfterMs`
- [x] After cooldown expires, next completion works
- [x] Fast course completion results in certificate with `heldUntil` set
- [x] Public `/api/certificates/verify/:id` returns `423` while `heldUntil` is in the future
- [x] Student cert list shows `isHeld: true` and `heldUntil` for held certs
- [x] Completion modal shows amber hold notice when `certificateHeldUntil` is in the response
- [x] Genuine students who spent real time are completely unaffected by all guards

## Files Changed

| File | What Changed |
|---|---|
| `backend/src/models/LessonProgress.ts` | + `watchedSeconds` field |
| `backend/src/models/Certificate.ts` | + `heldUntil` field |
| `backend/src/validators/content.validator.ts` | + `progressUpdateSchema` |
| `backend/src/controllers/course/progressController.ts` | All 3 guards |
| `backend/src/controllers/certificate/certificateController.ts` | `heldUntil` check on verify, `isHeld` in list |
| `frontend/src/features/student/pages/LessonViewer.tsx` | Video tracking, 403/429 UX, cert hold modal |
