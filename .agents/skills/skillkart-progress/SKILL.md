---
name: skillkart-progress
description: Lesson-level progress tracking for SkillKart — LessonProgress model, quiz gate, course completion, progress snapshot, and anti-cheat guards (video watch threshold, completion cooldown, certificate time lock).
---

# SkillKart Progress Tracking Guidelines

Covers per-lesson progress, quiz gating, course-level completion calculation, the dual-write pattern between `LessonProgress` and `Enrollment`, and the three anti-cheat guards that prevent instant completion glitches.

---

## Overview

- **Controller:** `backend/src/controllers/course/progressController.ts`
- **Models:**
  - `backend/src/models/LessonProgress.ts` — per-lesson completion record
  - `backend/src/models/Enrollment.ts` — course-level completion state
- **Routes:** `POST /api/lessons/:lessonId/progress` via `backend/src/routes/lessonRoutes.ts`
- **Validator:** `progressUpdateSchema` in `backend/src/validators/content.validator.ts`

---

## LessonProgress Model Fields

```typescript
{
  user: ObjectId;              // ref: User
  lesson: ObjectId;            // ref: Lesson
  completed: boolean;          // default: false
  progressPercentage: number;  // 0-100, clamped
  /**
   * Server-verified cumulative seconds the student has watched of the video.
   * Always updated with $max (only ever increases — no rewind exploits).
   * Used by Guard 1 (80% video watch threshold).
   */
  watchedSeconds: number;      // default: 0, min: 0
  lastWatchedAt?: Date;
  completedAt?: Date;          // set when completed === true
}
// Compound index: { user: 1, lesson: 1 } unique
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/lessons/:lessonId/progress` | student | Update lesson progress |
| GET | `/api/courses/:courseId/progress` | student | Get course-level progress snapshot |

### Request Body Schema (`progressUpdateSchema`)

```typescript
{
  completed?: boolean;           // explicitly mark complete / incomplete
  progressPercentage?: number;   // 0-100, completion triggered when >= 100
  lastWatchedAt?: string;        // ISO 8601 datetime
  watchedSeconds?: number;       // cumulative watched seconds (int, >= 0)
}
```

---

## Updating Lesson Progress (`updateLessonProgress`)

### Steps:
1. Resolve `Lesson → Section → Course` chain to validate the lesson belongs to an enrolled course.
2. Check enrollment exists (`status: { $in: ["active", "completed"] }`).
3. Clamp `progressPercentage` to `[0, 100]`.
4. Determine `wantsComplete`: true if `completed === true` OR `progressPercentage >= 100`.
5. **Guard 1 — Video watch threshold:** if `wantsComplete` and `lesson.type === "video"` and `durationMinutes > 0`, require `watchedSeconds >= durationMinutes * 60 * 0.8`. Returns `403` if not met.
6. **Guard 2 — Completion cooldown:** if `wantsComplete`, check if any other completed lesson in this enrollment has `completedAt >= now - 30s`. Returns `429` with `retryAfterMs` if within cooldown.
7. **Quiz gate:** if `wantsComplete` and lesson has a Quiz, the student must have a passing `QuizAttempt`. Returns `403` if not.
8. Upsert `LessonProgress` using `$set` + `$max: { watchedSeconds }` to prevent rewind cheats.
9. **Dual-write:** sync `Enrollment.completedLessonIds` (push/filter) and `Enrollment.lastAccessedLessonId`.
10. Trigger **auto-completion** if `completedLessonIds.length >= totalLessonsCount`.
11. Return progress doc + `courseProgress` snapshot + optional `certificateHeldUntil`.

---

## Anti-Cheat Guards

### Guard 1 — 80% Video Watch Threshold

**Backend:**
- `watchedSeconds` is accepted from the request body and stored with `$max` (monotonically increasing).
- When completing a `video` lesson with `durationMinutes > 0`, require `effectiveWatchedSeconds >= floor(durationMinutes * 60 * 0.8)`.
- `effectiveWatchedSeconds = max(incomingWatchedSeconds, storedWatchedSeconds)` — uses the best of what the client just sent vs. what's already stored.
- Error response: `403 { message, watchThresholdSeconds, watchedSeconds }`

**Frontend (`LessonViewer.tsx`):**
- Native `<video>`: `onTimeUpdate` updates `watchedSecondsRef.current` (a ref, not state, to avoid stale closures).
- YouTube/Vimeo `<iframe>`: `enablejsapi=1` appended to YouTube src; `window.addEventListener('message')` picks up `infoDelivery` events with `currentTime`.
- `handleProgress` sends `{ completed: true, watchedSeconds: watchedSecondsRef.current }`.
- On `403` with `watchThresholdSeconds` in body: info toast, NOT error toast.

### Guard 2 — Per-Lesson Completion Cooldown (30 seconds)

**Backend:**
- Filters `enrollment.completedLessonIds` excluding the current lesson.
- Queries `LessonProgress` for any of those with `completedAt >= now - 30_000ms`.
- Returns `429 { message, retryAfterMs }` if found.

**Frontend:**
- On `429`: info toast with countdown using `retryAfterMs`.

### Guard 3 — Enrollment-to-Certificate Time Lock

Documented in `skillkart-certificates` SKILL.md. Implemented inside the auto-completion chain in `updateLessonProgress`:
- Computes `totalCourseDurationMs` and `minimumRequiredMs = totalCourseDurationMs * 0.3`.
- If `enrollmentAgeMs < minimumRequiredMs`, Certificate is created with `heldUntil`.
- Response includes `certificateHeldUntil?: Date`.

---

## Auto-Completion Chain (inside `updateLessonProgress`)

Triggered when `completedLessonIds.length >= totalLessonsCount && enrollment.status !== "completed"`:

```typescript
enrollment.status = "completed";
enrollment.completedAt = new Date();
await enrollment.save();

// Guard 3: compute heldUntil if enrollment age < 30% of course duration
const certDoc = await Certificate.create({
  student, course, enrollment, issuedAt,
  ...(heldUntilDate ? { heldUntil: heldUntilDate } : {}),
});

await Notification.create({ ... });
```

Un-completion (un-marking a lesson after status was "completed") reverts `enrollment.status` to `"active"` **unless** a valid certificate already exists (AUDIT-41).

---

## Progress Snapshot (`getCourseProgressSnapshot`)

```typescript
{
  totalLessons: number;
  completedLessons: number;
  totalMandatoryLessons: number;
  completedMandatoryLessons: number;
  completionPercentage: number;  // 0-100, rounded
}
```

---

## Key Rules

- **Dual-write is mandatory:** always update both `LessonProgress` and `Enrollment` in the same request.
- **Guard order matters:** video threshold → cooldown → quiz gate → upsert. Do not reorder.
- **`$max` for watchedSeconds:** never use `$set` for `watchedSeconds` directly — always use `$max` in the upsert to prevent clock manipulation.
- **Quiz gate must be checked before marking complete** — never skip the `QuizAttempt` lookup.
- `progressPercentage` is always clamped between 0 and 100.
- Students can only update progress if enrolled (`active` or `completed` status).
- The auto-completion chain (certificate + notification) fires inside `progressController`, not in `enrollmentController`. Do not duplicate it.
- Guards 1 and 2 only trigger when `wantsComplete === true`. Pure `watchedSeconds` updates (no `completed: true`) pass through freely for tracking purposes.
- **Disciplinary certificate lock:** Auto-completion will never un-revoke a certificate marked with `isDisciplinaryRevocation: true` (AUDIT-110). Completion notifications and emails remain suppressed for administratively revoked credentials.

