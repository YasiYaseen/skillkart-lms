---
name: skillkart-progress
description: Lesson-level progress tracking for SkillKart — LessonProgress model, quiz gate, course completion, and progress snapshot calculation.
---

# SkillKart Progress Tracking Guidelines

Covers per-lesson progress, quiz gating, course-level completion calculation, and the dual-write pattern between `LessonProgress` and `Enrollment`.

---

## Overview

- **Controller:** `backend/src/controllers/course/progressController.ts`
- **Models:**
  - `backend/src/models/LessonProgress.ts` — per-lesson completion record
  - `backend/src/models/Enrollment.ts` — course-level completion state
- **Routes:** nested under `backend/src/routes/courseRoutes.ts`

---

## LessonProgress Model Fields

```typescript
{
  user: ObjectId;              // ref: User
  lesson: ObjectId;            // ref: Lesson
  completed: boolean;          // default: false
  progressPercentage: number;  // 0-100, clamped
  lastWatchedAt?: Date;
  completedAt?: Date;
}
// Compound index: { user: 1, lesson: 1 } unique
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/courses/:courseId/lessons/:lessonId/progress` | student | Update lesson progress |
| GET | `/api/courses/:courseId/progress` | student | Get course-level progress snapshot |

---

## Updating Lesson Progress (`updateLessonProgress`)

```typescript
// Body: { completed?: boolean, progressPercentage?: number, lastWatchedAt?: string }
// Requirement: student must have an active or completed enrollment
```

### Steps:
1. Resolve `Lesson → Section → Course` chain to validate the lesson belongs to an enrolled course.
2. Check enrollment exists (`status: { $in: ["active", "completed"] }`).
3. Clamp `progressPercentage` to `[0, 100]`.
4. Determine `wantsComplete`: true if `completed === true` OR `progressPercentage >= 100`.
5. **Quiz gate:** if `wantsComplete` and lesson has a Quiz, the student must have a passing `QuizAttempt`. Returns `403` if not.
6. Upsert `LessonProgress` with `findOneAndUpdate`.
7. **Dual-write:** sync `Enrollment.completedLessonIds` (push/filter) and `Enrollment.lastAccessedLessonId`.
8. Trigger **auto-completion** if `completedLessonIds.length >= totalLessonsCount`.
9. Return progress doc + `courseProgress` snapshot.

---

## Auto-Completion Chain (inside `updateLessonProgress`)

Triggered when `completedLessonIds.length >= totalLessonsCount && enrollment.status !== "completed"`:

```typescript
enrollment.status = "completed";
enrollment.completedAt = new Date();
await enrollment.save();

// Idempotent certificate issuance
await Certificate.findOneAndUpdate(
  { student: userId, course: courseId },
  { $setOnInsert: { student, course, enrollment, issuedAt } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

// Notify student
await Notification.create({
  recipient: userId,
  title: "Course Completed! 🎉",
  message: `Congratulations on completing "${course.title}"! Your certificate is ready.`,
  type: "success",
  link: "/my-certificates",
});
```

Un-completion (un-marking a lesson after status was "completed") reverts `enrollment.status` to `"active"`.

---

## Progress Snapshot (`getCourseProgressSnapshot`)

Used internally and returned in progress update responses:

```typescript
{
  totalMandatoryLessons: number;
  completedMandatoryLessons: number;
  completionPercentage: number;  // 0-100, rounded
}
```

Note: snapshot counts only **mandatory** lessons (`lesson.isMandatory === true`). The `getMyCourseProgress` endpoint counts **all** lessons.

---

## Key Rules

- **Dual-write is mandatory:** always update both `LessonProgress` and `Enrollment` in the same request — they must stay in sync.
- **Quiz gate must be checked before marking complete** — never skip the `QuizAttempt` lookup.
- `progressPercentage` is always clamped between 0 and 100.
- Students can only update progress if enrolled (`active` or `completed` status).
- The auto-completion chain (certificate + notification) fires inside `progressController`, not in `enrollmentController`. Do not duplicate it.
