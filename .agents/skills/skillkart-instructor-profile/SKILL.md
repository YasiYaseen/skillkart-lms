---
name: skillkart-instructor-profile
description: Instructor public profiles in SkillKart — stats aggregation, published courses, social links, and public profile view.
---

# SkillKart Instructor Public Profile Guidelines

Comprehensive guidelines for instructor public profiles, instructor stats calculation (courses, enrolled students, reviews, average rating), and student discovery.

---

## Overview

- **Model Location:** `backend/src/models/User.ts`, `backend/src/models/Course.ts`, `backend/src/models/Enrollment.ts`, `backend/src/models/Review.ts`
- **Controller Location:** `backend/src/controllers/user/userController.ts` (`getPublicInstructorProfile`)
- **Route Location:** `backend/src/routes/userRoutes.ts` (`GET /api/users/instructor/:instructorId`)
- **Frontend Location:** `frontend/src/pages/InstructorPublicProfile.tsx` (Route: `/instructors/:instructorId`)

---

## How It Works

1. Anyone (authenticated or guest) can view an instructor's public profile via `/instructors/:instructorId`.
2. The backend controller validates the instructor ID, verifies the user exists and is active with role `instructor` or `admin`.
3. It fetches all published courses by this instructor and computes:
   - `totalCourses`: Count of published courses.
   - `totalStudents`: Count of distinct active/completed enrollments across the instructor's courses.
   - `totalReviews`: Total review count across the instructor's courses.
   - `averageRating`: Overall weighted mean star rating across the instructor's courses.
4. The frontend displays the instructor avatar, headline, bio, expertise tags, social links, stats banner, and a grid of course cards.

---

## Key Rules

- Only public, non-sensitive fields (`name`, `avatar`, `headline`, `bio`, `interests`, `socialLinks`, `createdAt`) are returned. Email, password, and internal IDs are never leaked.
- Only courses with `isPublished: true` are returned to public viewers.
- Wrap stats aggregation queries cleanly to avoid throwing when an instructor has 0 courses or reviews.

---

## Code Example

```typescript
// Fetching public instructor profile in backend
export const getPublicInstructorProfile = async (req: Request, res: Response): Promise<void> => {
  const { instructorId } = req.params;
  const instructor = await User.findOne({ _id: instructorId, isActive: true }).select('name avatar headline bio interests socialLinks createdAt role');
  if (!instructor || !['instructor', 'admin'].includes(instructor.role)) {
    res.status(404).json({ success: false, message: 'Instructor not found' });
    return;
  }
  const courses = await Course.find({ instructor: instructorId, isPublished: true });
  // Aggregate stats...
  res.json({ success: true, instructor, stats, courses });
};
```

---

## Integration Points

- `CourseDetailsPage.tsx` — Instructor name links to `/instructors/:instructorId`.
- `CourseCard.tsx` — Instructor name can navigate to public profile.
- `Onboarding` / `Profile` — Instructors configure their headline, bio, interests, and social links.

---

## Extending This Feature

1. Add custom social platforms in `User.ts` `socialLinks`.
2. Add instructor badges/certifications.
3. Update `InstructorPublicProfile.tsx` and this `SKILL.md`.
