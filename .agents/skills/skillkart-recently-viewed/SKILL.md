---
name: skillkart-recently-viewed
description: Recently viewed courses tracking, LRU history, and quick access strip in SkillKart.
---

# SkillKart Recently Viewed Courses Guidelines

Guidelines for tracking, storing, and displaying a student's recently browsed courses.

---

## Overview

- **Model Location:** `backend/src/models/User.ts` (`recentlyViewedCourses: [{ type: ObjectId, ref: 'Course' }]`)
- **Controller Location:** `backend/src/controllers/user/userController.ts` (`recordRecentlyViewedCourse`, `getRecentlyViewedCourses`)
- **Route Location:** `backend/src/routes/meRoutes.ts` (`POST /api/me/recently-viewed/:courseId`, `GET /api/me/recently-viewed`)
- **Frontend Location:** `frontend/src/components/course/RecentlyViewedCourses.tsx`

---

## How It Works

1. When a user opens any `CourseDetailsPage`, a silent POST request is made to `POST /api/me/recently-viewed/:courseId`.
2. The controller:
   - Filters out previous occurrences of the course from the user's `recentlyViewedCourses` array (deduplication).
   - Unshifts the new course ID to the top (LRU order).
   - Slices the array to maintain at most 10 items.
   - Saves the user document.
3. When the user visits `MyCourses` or `CourseList`, `GET /api/me/recently-viewed` returns populated courses.
4. `RecentlyViewedCourses` renders a compact 4-card strip with thumbnails and direct links.

---

## Key Rules

- For unauthenticated users, the frontend call silently catches errors without blocking or notifying.
- Ensure populated course objects filter out nulls (in case a course was deleted).
- Limit the array size to prevent unbounded document growth in MongoDB.

---

## Code Example

```typescript
// Recording course view in userController
export const recordRecentlyViewedCourse = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id;
  const { courseId } = req.params;
  const user = await User.findById(userId);
  if (!user) return;
  const current = (user.recentlyViewedCourses || []).filter(id => id.toString() !== courseId);
  user.recentlyViewedCourses = [new Types.ObjectId(courseId), ...current].slice(0, 10);
  await user.save();
  res.json({ success: true });
};
```

---

## Integration Points

- `CourseDetailsPage.tsx` — triggers view recording on mount.
- `MyCourses.tsx` — renders `<RecentlyViewedCourses />`.
- `CourseList.tsx` — renders `<RecentlyViewedCourses />`.

---

## Extending This Feature

1. Store anonymous recently viewed courses in browser `localStorage` and sync upon login.
2. Add a "Clear recently viewed" button.
3. Update `RecentlyViewedCourses.tsx` and this `SKILL.md`.
