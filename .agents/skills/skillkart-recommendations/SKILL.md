---
name: skillkart-recommendations
description: Personalized course recommendation engine in SkillKart based on user interests, popular topics, and top ratings.
---

# SkillKart Course Recommendations Guidelines

Guidelines for personalized and popular course discovery, recommendation ranking algorithms, and carousel components.

---

## Overview

- **Model Location:** `backend/src/models/Course.ts`, `backend/src/models/User.ts`
- **Controller Location:** `backend/src/controllers/course/courseController.ts` (`getCourseRecommendations`)
- **Route Location:** `backend/src/routes/courseRoutes.ts` (`GET /api/courses/recommendations`)
- **Frontend Location:** `frontend/src/components/course/CourseRecommendations.tsx`

---

## How It Works

1. When a user requests recommendations (`GET /api/courses/recommendations`):
   - If authenticated, their onboarding `interests` array is retrieved.
   - The query searches for published courses matching any of those tags/interests using `$in` regex.
   - If fewer than 4 matching courses are found (or user has no interests / guest), it falls back to top-rated, highly enrolled published courses.
2. Courses are sorted by `averageRating: -1, reviewCount: -1, createdAt: -1`.
3. Results exclude courses the student is already enrolled in.
4. The frontend renders a horizontal card grid with rating, price, and tags.

---

## Key Rules

- Only published courses (`isPublished: true`) are recommended.
- Handle unauthenticated requests gracefully by returning general top-rated courses.
- Filter out courses already enrolled by the student.

---

## Code Example

```typescript
// Recommendation query logic in backend
const matchQuery: Record<string, unknown> = { isPublished: true };
if (userInterests && userInterests.length > 0) {
  matchQuery.$or = [
    { tags: { $in: userInterests } },
    { level: userSkillLevel },
  ];
}
const recommendations = await Course.find(matchQuery)
  .sort({ averageRating: -1, reviewCount: -1 })
  .limit(6)
  .populate('instructor', 'name');
```

---

## Integration Points

- `CourseList.tsx` — shows recommended courses at bottom of catalog.
- `MyCourses.tsx` — shows "Recommended Next Steps" on student dashboard.
- `CourseDetailsPage.tsx` — shows related courses.

---

## Extending This Feature

1. Implement collaborative filtering based on what other students with similar enrollments took.
2. Add weight modifiers for course completion velocity.
3. Update `CourseRecommendations.tsx` and this `SKILL.md`.
