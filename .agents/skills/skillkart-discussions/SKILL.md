---
name: skillkart-discussions
description: Lesson discussions and Q&A system for SkillKart — threaded comments, instructor badges, and moderation.
---

# SkillKart Discussions Guidelines

Instructions on how to manage lesson discussions, comments, and Q&A threads in the SkillKart LMS workspace.

---

## Overview

- **Model Location:** `backend/src/models/Comment.ts`
- **Controller Location:** `backend/src/controllers/course/commentController.ts`
- **Route Location:** `backend/src/routes/lessonRoutes.ts` (`/api/lessons/:lessonId/comments`)
- **Frontend Location:** `frontend/src/features/student/components/LessonDiscussion.tsx`

---

## How It Works

1. Students and instructors post questions, answers, and replies under specific lessons.
2. Comments support 1-level threading (`parentCommentId`) to organize discussion replies.
3. Instructor badges (`Instructor 🎓`) are highlighted dynamically based on course ownership.
4. Users can delete their own comments; instructors and admins can moderate/delete any comment in their course.

---

## Key Rules

- Viewing and creating comments requires active enrollment in the course (or being the course instructor/admin).
- Comment content must be validated (2 to 2,000 characters) via `comment.validator.ts`.
- Deleting a parent comment cascades to delete its associated child replies.

---

## Code Example

```typescript
import Comment from "../../models/Comment";

// Create comment or reply
const comment = await Comment.create({
  lesson: lessonId,
  user: req.user.id,
  content: parsed.data.content,
  parentCommentId: parsed.data.parentCommentId || null,
});
```

---

## Integration Points

- `LessonViewer.tsx`: Houses the Discussion tab where `LessonDiscussion.tsx` is rendered.
- `comment.validator.ts`: Zod schema for comment input validation.
