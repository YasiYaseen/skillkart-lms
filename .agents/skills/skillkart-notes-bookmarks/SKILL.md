---
name: skillkart-notes-bookmarks
description: Personal study notes and lesson bookmarks for SkillKart — models, scoped queries, inline editors, and study hub.
---

# SkillKart Notes and Bookmarks Guidelines

Instructions on how to manage personal student notes and lesson bookmarks in the SkillKart LMS workspace.

---

## Overview

- **Model Locations:**
  - `backend/src/models/Note.ts`
  - `backend/src/models/Bookmark.ts`
- **Controller Locations:**
  - `backend/src/controllers/course/noteController.ts`
  - `backend/src/controllers/course/bookmarkController.ts`
- **Route Locations:**
  - `backend/src/routes/noteRoutes.ts` (`/api/notes/:noteId`)
  - `backend/src/routes/lessonRoutes.ts` (`/api/lessons/:lessonId/notes`, `/api/lessons/:lessonId/bookmark`)
  - `backend/src/routes/meRoutes.ts` (`/api/me/notes`, `/api/me/courses/:courseId/notes`, `/api/me/bookmarks`, `/api/me/courses/:courseId/bookmarks`)
- **Frontend Locations:**
  - `frontend/src/features/student/api/notes.ts`
  - `frontend/src/features/student/api/bookmarks.ts`
  - `frontend/src/features/student/components/LessonNotes.tsx`
  - `frontend/src/features/student/pages/LessonViewer.tsx`
  - `frontend/src/features/student/pages/NotesAndBookmarksPage.tsx`

---

## How It Works

1. **Lesson Notes**: Students can write, view, edit, and delete private study notes attached to specific lessons within courses they are actively enrolled in.
2. **Lesson Bookmarks**: Students can toggle bookmarks on lessons to mark them for revision. Bookmarks are displayed with gold badges on the lesson player sidebar and listed on the centralized Study Hub page (`/study-hub` or `/my-notes` / `/my-bookmarks`).
3. **Access Control**: Users can only create notes/bookmarks for courses they are enrolled in (or instructors/admins for that course). Notes and bookmarks are scoped strictly to the authenticated user.

---

## Key Rules

- Notes are private to the author student; other students cannot view them.
- Deleting or editing a note requires ownership (`note.user.toString() === req.user.id`) or `admin` role.
- Bookmark toggling is idempotent — toggling on an existing bookmark deletes it, while toggling without one creates it with a compound unique index `{ user: 1, lesson: 1 }`.
- Always validate note content (length 1 to 5,000 chars) using `note.validator.ts`.

---

## Code Example

```typescript
import Note from "../../models/Note";
import Bookmark from "../../models/Bookmark";

// Create note
const note = await Note.create({
  user: req.user.id,
  course: courseId,
  lesson: lessonId,
  content: parsed.data.content,
});

// Toggle bookmark
const existing = await Bookmark.findOne({ user: req.user.id, lesson: lessonId });
if (existing) {
  await Bookmark.findByIdAndDelete(existing._id);
} else {
  await Bookmark.create({ user: req.user.id, course: courseId, lesson: lessonId });
}
```

---

## Integration Points

- `LessonViewer.tsx`: Contains the Notes tab, bookmark toggle button in the lesson banner, and bookmark indicator in the curriculum sidebar.
- `Header.tsx`: Provides the top navigation link to "Study Hub" for students.
- `NotesAndBookmarksPage.tsx`: Centralized study dashboard with search and course filters.

---

## Extending This Feature

1. To add rich-text or markdown formatting to notes, update the `LessonNotes.tsx` editor component.
2. To add timestamped video notes (e.g. at 03:45), add an optional `videoTimestampSeconds?: number` field to `Note.ts` and `note.validator.ts`.
3. Update this `SKILL.md` whenever new fields or routes are introduced.
