---
name: skillkart-learning-streaks
description: Student learning streak tracking, daily active dates, and motivation metrics in SkillKart.
---

# SkillKart Learning Streaks Guidelines

Guidelines for tracking continuous daily learning activity, streak increments, freeze/reset logic, and motivation card components.

---

## Overview

- **Model Location:** `backend/src/models/User.ts` (`currentStreak`, `longestStreak`, `lastActiveDate`, `activeDates`)
- **Service Location:** `backend/src/services/streakService.ts` (`recordUserActivity`)
- **Controller Location:** `backend/src/controllers/user/userController.ts` (`getStudentStreak`)
- **Route Location:** `backend/src/routes/meRoutes.ts` (`GET /api/me/streak`)
- **Frontend Location:** `frontend/src/features/student/components/LearningStreakCard.tsx`

---

## How It Works

1. When a user completes a lesson or enrolls in a course, `recordUserActivity(userId)` is called.
2. The service formats today's date (`YYYY-MM-DD` UTC).
3. If user's `lastActiveDate` was:
   - **Today**: streak remains the same (activity already recorded today).
   - **Yesterday**: `currentStreak` increments by 1.
   - **Older than yesterday**: `currentStreak` resets to 1.
4. `longestStreak` is updated to `Math.max(longestStreak, currentStreak)`.
5. `activeDates` keeps a sliding log of past 30 days active for the streak calendar.
6. The `LearningStreakCard` displays a flame badge, current streak, longest streak, and a 7-day visual dot matrix.

---

## Key Rules

- Always wrap streak recording in a non-blocking `try/catch` or background call so failures never fail user progress/completion.
- Use strict ISO date strings (`YYYY-MM-DD`) for timezone consistency.
- Return default streak data (zeros) safely for newly registered users.

---

## Code Example

```typescript
import { recordUserActivity } from '../services/streakService';

// Inside progressController or enrollmentController
try {
  await recordUserActivity(userId);
} catch (err) {
  logger.error('Failed to record learning streak activity:', err);
}
```

---

## Integration Points

- `progressController.ts` — updates streak when a lesson is marked completed.
- `enrollmentController.ts` — updates streak when enrolling in a new course.
- `MyCourses.tsx` — mounts `<LearningStreakCard />` at the top of the student dashboard.

---

## Extending This Feature

1. Add streak freeze power-ups or grace periods.
2. Add automated email notifications for streak milestones (e.g. 7-day, 30-day streak) via `emailService`.
3. Update `LearningStreakCard.tsx` and this `SKILL.md`.
