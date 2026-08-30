---
name: skillkart-core
description: Core architectural patterns, coding standards, and common agent tasks for the SkillKart LMS project.
---

# SkillKart Core Agent Guide

This is the primary reference for all agents working on SkillKart. Read this first before making any code changes.

---

## Project Structure

```
skillkart/
├── backend/src/
│   ├── controllers/   # HTTP handlers — keep thin, delegate business logic
│   ├── models/        # Mongoose schemas — always use timestamps & indexes
│   ├── routes/        # Express routers — apply auth & validation middleware here
│   ├── validators/    # Zod schemas — validate all request bodies and params
│   └── middleware/    # authMiddleware, role checks, validation handlers
├── frontend/src/
│   ├── features/      # Domain modules: auth, student, instructor, admin, enrollment
│   ├── components/    # Shared reusable UI components
│   ├── pages/         # Route-level views
│   ├── lib/           # Axios instance and utility helpers
│   └── styles/        # Tailwind config, Sass definitions, animations
├── docs/
│   ├── FEATURES.md           # Feature tracker — always keep statuses in sync
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── features/mvp/         # Per-feature spec files
└── .agents/skills/            # ALL skill files live here
```

---

## Backend Patterns (Express + TypeScript)

### 1. Separation of Concerns
- **Routes (`src/routes/`):** Define API endpoints. Apply `authMiddleware` and Zod validators here, not in controllers.
- **Controllers (`src/controllers/`):** Handle HTTP req/res. Keep logic minimal for simple CRUD; extract complex logic into helpers.
- **Models (`src/models/`):** Mongoose schemas only. Always include `{ timestamps: true }` and compound indexes on `userId`, `courseId`, `sectionId`.
- **Validators (`src/validators/`):** Zod schemas for all request bodies and query params. No `any`.

### 2. Error Handling
- All endpoints must return consistent JSON error objects: `{ message: string }`.
- Use `try/catch` in every controller. Never let unhandled promise rejections escape.
- Notifications must always be wrapped in their own `try/catch` — never let a failed notification break the primary transaction.

### 3. Authentication & Authorization
- Use `authMiddleware` on all protected routes.
- Access the authenticated user via `req.user` after middleware.
- Use role-check middleware (`isInstructor`, `isAdmin`) for privileged routes.

### 4. Database Conventions
- Always use `{ timestamps: true }` on every schema.
- Add compound indexes for common lookup patterns, e.g.:
  ```typescript
  schema.index({ userId: 1, courseId: 1 }, { unique: true });
  ```
- Use `$setOnInsert` with `findOneAndUpdate + upsert` for idempotent record creation (e.g., certificates).

---

## Frontend Patterns (React + Vite + TailwindCSS v4)

### 1. Feature-Based Architecture
- All feature code lives in `src/features/<domain>/`:
  - `auth/` — login, register, Google OAuth
  - `student/` — dashboard, learning board
  - `instructor/` — course/section/lesson CRUD
  - `admin/` — platform administration
  - `enrollment/` — subscription and tracking
- Each feature folder owns its own components, hooks, and services.

### 2. Styling
- Use TailwindCSS v4 utility classes for all layout and spacing.
- Use Sass (`src/styles/`) for complex custom animations and global overrides.
- Maintain the **premium aesthetic**: subtle gradients, glassmorphism (`backdrop-blur`), smooth transitions (`transition-all duration-300`).

### 3. State & API Calls
- Use the pre-configured Axios instance from `src/lib/axios.ts`.
- Prefer `useEffect` + `useState` for local async state.
- Avoid prop-drilling for deeply shared state; lift state to page level or use context.

---

## Coding Standards

| Rule | Detail |
|---|---|
| TypeScript | Strict mode. No `any`. Use proper interfaces/types. |
| Naming | `camelCase` for variables/functions, `PascalCase` for components/classes |
| Comments | JSDoc for all exported functions. Inline comments on complex logic. |
| Dead Code | Remove unused imports, commented-out blocks, and unresolved TODOs. |
| Testing | New features should include unit or integration tests (Vitest/Jest). |

---

## Common Agent Tasks

### Adding a New Backend Feature
1. Create the Mongoose model in `backend/src/models/`.
2. Add Zod validator in `backend/src/validators/`.
3. Implement controller in `backend/src/controllers/<domain>/`.
4. Register the route in `backend/src/routes/` with appropriate middleware.

### Adding a New Frontend Feature
1. Create component(s) in `frontend/src/features/<domain>/components/`.
2. Add page view in `frontend/src/features/<domain>/pages/` if needed.
3. Wire up API calls using the Axios instance.
4. Register the route in the main router.

### Adding Course-Scoped Features
1. Backend controllers go in `backend/src/controllers/course/`.
2. Register nested endpoints in `backend/src/routes/courseRoutes.ts`.
3. Surface aggregate values (e.g., rating counts) directly on course list/detail API responses.
4. Keep student-facing UI on the existing course detail page.

---

## Skill Files Index

All skill files for this project live in `.agents/skills/`. Before implementing any subsystem, check if a skill file already exists for it. After implementing a new pattern or subsystem, create or update the relevant skill file using `.agents/skills/SKILL_TEMPLATE.md`.

| Skill | Covers |
|---|---|
| `skillkart-core` | Architecture, coding standards, common tasks (this file) |
| `skillkart-auth` | JWT, Google OAuth, `protect`/`authorize` middleware, onboarding |
| `skillkart-enrollment` | Enrollment lifecycle, progress updates, auto-completion |
| `skillkart-progress` | LessonProgress model, quiz gate, dual-write, course completion |
| `skillkart-quiz` | Quiz CRUD, submission scoring, quiz gate integration |
| `skillkart-reviews` | Reviews, ratings aggregation, enrollment gate |
| `skillkart-certificates` | Certificate auto-issuance, unique ID, verification routes, PDF export |
| `skillkart-notifications` | Notification model, trigger patterns, supported types |
| `skillkart-wishlist` | Wishlist CRUD, enriched course response |
| `skillkart-file-upload` | Multer config, allowed types, size limits, serving files |
| `skillkart-notes-bookmarks` | Personal study notes, lesson bookmarks, scoped queries, study hub |
| `skillkart-email-notifications` | Outbound transactional emails (welcome, enrollment, certificates) |
| `skillkart-announcements` | Course announcements, instructor broadcasting, mass notifications |
| `skillkart-discussions` | Lesson discussions, comments, threading, instructor badges |
| `skillkart-instructor-analytics` | Advanced instructor metrics, revenue calculation, completion rates |
| `skillkart-search` | Advanced multi-filter search, sorting, rating aggregations |
| `skillkart-theme` | Dark mode, ThemeContext, OS preference listening, Tailwind classes |
| `skillkart-instructor-profile` | Public instructor profiles, aggregated metrics, social links, public catalog |
| `skillkart-learning-streaks` | Daily learning activity tracking, streak counters, 7-day visual calendar |
| `skillkart-recommendations` | Smart course recommendations based on interests and popularity |
| `skillkart-recently-viewed` | LRU recently viewed courses tracking and quick-access strip |
| `skillkart-audit-logs` | Admin security audit logging and inspector UI |
| `skillkart-faq` | Course FAQ management, ordering, and accordion viewer |
| `skillkart-bulk-upload` | Bulk lesson creation and CSV / batch parsing for sections |
