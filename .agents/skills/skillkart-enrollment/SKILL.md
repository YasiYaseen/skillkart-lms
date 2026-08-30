---
name: skillkart-enrollment
description: Enrollment system for SkillKart — enrolling students, tracking status, progress updates, and auto-completion logic.
---

# SkillKart Enrollment Guidelines

Covers the full lifecycle of a student enrollment: creation, progress tracking, status transitions, and auto-completion.

---

## Overview

- **Controller:** `backend/src/controllers/enrollment/enrollmentController.ts`
- **Model:** `backend/src/models/Enrollment.ts`
- **Validator:** `backend/src/validators/enrollmentValidator.ts`
- **Routes:** `backend/src/routes/enrollmentRoutes.ts`

---

## Enrollment Model Fields

```typescript
{
  student: ObjectId;              // ref: User
  course: ObjectId;               // ref: Course
  status: "active" | "completed" | "cancelled";  // default: "active"
  paymentStatus: "none" | "paid"; // default: "none"
  totalLessonsCount: number;      // snapshot of lesson count at enrollment time
  completedLessonIds: ObjectId[]; // array of completed lesson IDs
  lastAccessedLessonId?: ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
}
// Compound index: { student: 1, course: 1 } unique
// Virtual: progressPercentage = completedLessonIds.length / totalLessonsCount * 100
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/enrollments` | student | Enroll in a course |
| GET | `/api/enrollments` | student | List my enrollments (paginated) |
| GET | `/api/enrollments/course/:courseId` | student | Get single course enrollment |
| PATCH | `/api/enrollments/:id/progress` | student | Mark lesson complete/incomplete |
| DELETE | `/api/enrollments/:id` | student | Cancel enrollment |
| GET | `/api/enrollments/course/:courseId/students` | instructor/admin | List students in a course |

---

## Enrollment Rules

- Only **published** courses can be enrolled in. Archived/draft = 400.
- Instructors **cannot** enroll in their own courses.
- Re-enrolling a **cancelled** enrollment reactivates it and resets `completedLessonIds`.
- `totalLessonsCount` is snapshotted at enrollment time from the current Section/Lesson structure.

---

## Progress Update Flow (`PATCH /enrollments/:id/progress`)

```typescript
// Body: { lessonId: string, completed: boolean }
// Uses $addToSet / $pull to update completedLessonIds
// Syncs LessonProgress collection via upsert
// Triggers auto-completion when completedLessonIds.length >= totalLessonsCount
```

### Auto-completion chain (triggered inside `updateProgress`):
1. Set `enrollment.status = "completed"` and `enrollment.completedAt = new Date()`.
2. Auto-issue certificate via `Certificate.findOneAndUpdate` with `$setOnInsert` (idempotent).
3. Send completion notification to student.

### Un-completion (un-marking a lesson after course was completed):
- Reverts `enrollment.status` back to `"active"` and clears `completedAt`.

---

## Notifications Fired

| Event | Recipient | Type |
|---|---|---|
| New enrollment | Student + Instructor | `success` / `info` |
| Enrollment reactivated | Student + Instructor | `success` / `info` |
| Course completed | Student | `success` |

Always wrap `Notification.create()` in the same `try/catch` as the main transaction — do NOT isolate it, as it is considered part of the enrollment flow here.

---

## Key Rules

- Always use `toJSON({ virtuals: true })` when returning enrollment documents so `progressPercentage` virtual is included.
- Filter out null-course enrollments when populating (courses may be deleted).
- Never allow `completedLessonIds.length > totalLessonsCount` — guard against this state.
