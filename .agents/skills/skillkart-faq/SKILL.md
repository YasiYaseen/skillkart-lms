---
name: skillkart-faq
description: Course FAQs system in SkillKart — instructor management, ordering, and accordion viewer.
---

# SkillKart Course FAQ Guidelines

Guidelines for creating, managing, reordering, and presenting frequently asked questions for courses.

---

## Overview

- **Model Location:** `backend/src/models/CourseFAQ.ts`
- **Validator Location:** `backend/src/validators/faq.validator.ts`
- **Controller Location:** `backend/src/controllers/course/faqController.ts`
- **Route Location:** Mounted in `backend/src/routes/courseRoutes.ts` (`/api/courses/:courseId/faqs`)
- **Frontend Location:**
  - Student: `frontend/src/components/course/CourseFAQAccordion.tsx`
  - Instructor: `frontend/src/features/instructor/components/CourseFAQEditor.tsx`

---

## How It Works

1. Instructors can define questions and detailed answers for their courses via the Course FAQ Editor on the Edit Course page.
2. FAQs are stored in MongoDB with fields `course`, `question`, `answer`, and `order`.
3. Students and prospective learners can view FAQs in an interactive accordion on `CourseDetailsPage`.
4. Anyone can read FAQs (`GET /api/courses/:courseId/faqs`). Only the course instructor or an admin can create, update, or delete FAQs.

---

## Key Rules

- Question length must be between 5 and 300 characters; answer between 5 and 3000 characters.
- When creating a FAQ without an explicit order, automatically assign `(maxOrder || 0) + 1`.
- When a course is deleted, cascade delete all associated CourseFAQ documents.

---

## Code Example

```typescript
// Creating course FAQ
export const createCourseFAQ = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const { question, answer, order } = req.body;
  const faq = await CourseFAQ.create({
    course: courseId,
    question,
    answer,
    order: order ?? 1,
  });
  res.status(201).json({ success: true, faq });
};
```

---

## Integration Points

- `CourseDetailsPage.tsx` — mounts `<CourseFAQAccordion />`.
- `EditCourse.tsx` — mounts `<CourseFAQEditor />`.
- `faqController.ts` — enforces instructor ownership check.

---

## Extending This Feature

1. Add rich markdown / link formatting support in FAQ answers.
2. Add upvoting / "Was this helpful?" feedback on individual FAQs.
3. Update `CourseFAQAccordion.tsx` and this `SKILL.md`.
