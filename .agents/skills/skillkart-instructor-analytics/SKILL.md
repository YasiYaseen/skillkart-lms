---
name: skillkart-instructor-analytics
description: Advanced analytics for instructors in SkillKart — revenue metrics, student completion rates, and enrollment charts.
---

# SkillKart Instructor Analytics Guidelines

Instructions on how to compute and display instructor analytics in the SkillKart LMS workspace.

---

## Overview

- **Controller Location:** `backend/src/controllers/instructor/instructorController.ts`
- **Route Location:** `backend/src/routes/instructorRoutes.ts` (`/api/instructor/analytics`, `/api/instructor/dashboard`)
- **Frontend Location:** `frontend/src/features/instructor/pages/Analytics.tsx` & `Dashboard.tsx`

---

## How It Works

1. Aggregates data across an instructor's published courses, total enrollments, completion rates, and calculated revenue.
2. Formats monthly enrollment timelines and course-by-course performance breakdowns.
3. Renders interactive chart widgets and statistical KPI cards in the instructor studio.

---

## Key Rules

- Only accessible by users with `instructor` or `admin` role.
- All aggregations must be scoped strictly to courses where `instructor === req.user.id`.
- Handle zero-enrollment edge cases gracefully without returning `NaN` or dividing by zero.

---

## Code Example

```typescript
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";

// Aggregate instructor statistics
const courses = await Course.find({ instructor: req.user.id }).select("_id price title");
const courseIds = courses.map((c) => c._id);

const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });
const completedEnrollments = await Enrollment.countDocuments({
  course: { $in: courseIds },
  status: "completed",
});

const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
```
