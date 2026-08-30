---
name: skillkart-search
description: Advanced course search and filtering system for SkillKart — multi-field text queries, price/level filters, and sorting.
---

# SkillKart Search Guidelines

Instructions on how to handle advanced course searching, sorting, and multi-criteria filtering in the SkillKart LMS workspace.

---

## Overview

- **Controller Location:** `backend/src/controllers/course/courseController.ts`
- **Route Location:** `backend/src/routes/courseRoutes.ts` (`GET /api/courses`)
- **Frontend Location:** `frontend/src/pages/courses/CourseList.tsx`

---

## How It Works

1. Search endpoint parses query parameters: `search`, `category`, `level`, `price`, `sort`, `page`, `limit`.
2. Builds dynamic MongoDB filters supporting regex text matching across course `title` and `description`.
3. Populates aggregate review counts, average star ratings, and student enrollment counts on returned courses.

---

## Key Rules

- Only published courses (`status: "published"`) should be returned to students and guests.
- Escape special regex characters in search strings to prevent ReDoS or invalid regex errors.
- Support sorting by `newest`, `popular` (enrollments), `highest-rated` (ratings), `price-asc`, and `price-desc`.
