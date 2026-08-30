---
name: skillkart-bulk-upload
description: Bulk lesson upload and CSV batch creation in SkillKart.
---

# SkillKart Bulk Lesson Upload Guidelines

Guidelines for importing multiple lessons at once, CSV / plain text parsing, atomic batch insertion, and dynamic curriculum editors.

---

## Overview

- **Model Location:** `backend/src/models/Lesson.ts`
- **Validator Location:** `backend/src/validators/bulkLesson.validator.ts`
- **Controller Location:** `backend/src/controllers/course/bulkLessonController.ts`
- **Route Location:** Mounted in `backend/src/routes/sectionRoutes.ts` (`POST /api/sections/:sectionId/lessons/bulk`)
- **Frontend Location:** `frontend/src/features/instructor/components/BulkLessonUploadModal.tsx`

---

## How It Works

1. Instructors click "⚡ Bulk Add Lessons" on any section in the Curriculum Builder (`CreateCourse.tsx` / `EditCourse.tsx`).
2. The modal allows two input modes:
   - **Interactive Table**: Add, remove, edit rows with type dropdowns, duration, and preview toggles.
   - **CSV / Paste Parser**: Paste raw lines like `Title, Duration, Type, isPreview` and convert to structured table rows automatically.
3. The client sends a batch payload `POST /api/sections/:sectionId/lessons/bulk` with `{ lessons: [...] }`.
4. The controller validates ownership, counts existing section lessons to compute successive `order` indices, and executes `Lesson.insertMany(...)`.
5. The section curriculum updates immediately without full page reloads.

---

## Key Rules

- Enforce a maximum batch size of 50 lessons per single request to prevent CPU overload.
- Calculate contiguous order indexes sequentially starting after the highest current lesson order in that section.
- Only the section's course owner or an admin can upload lessons.

---

## Code Example

```typescript
// Bulk lesson insertion
export const bulkCreateLessons = async (req: Request, res: Response): Promise<void> => {
  const { sectionId } = req.params;
  const { lessons } = req.body;
  const currentCount = await Lesson.countDocuments({ section: sectionId });
  const docsToInsert = lessons.map((item: any, idx: number) => ({
    section: sectionId,
    title: item.title,
    durationMinutes: item.durationMinutes ?? 10,
    order: currentCount + idx + 1,
    isPreview: Boolean(item.isPreview),
    isMandatory: item.isMandatory !== false,
  }));
  const created = await Lesson.insertMany(docsToInsert);
  res.status(201).json({ success: true, count: created.length, lessons: created });
};
```

---

## Integration Points

- `CreateCourse.tsx` — triggers `<BulkLessonUploadModal />` from section card header.
- `bulkLessonController.ts` — validates section and course instructor ownership.
- `sectionRoutes.ts` — mounts bulk endpoint under `/api/sections/:sectionId/lessons/bulk`.

---

## Extending This Feature

1. Add automatic lesson content generation / import from zip packages or video files.
2. Add Excel file (.xlsx) file drag-and-drop parsing.
3. Update `BulkLessonUploadModal.tsx` and this `SKILL.md`.
