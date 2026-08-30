# SkillKart Feature Strengthening Plan

> **Purpose:** This document audits each core feature of SkillKart and identifies concrete improvements — including real bugs found by code audit — that will raise UX quality, data integrity, and product polish.
>
> **Status Labels:**
> - `Not Started` — identified but no work done
> - `In Progress` — actively being worked on
> - `Done` — improvement implemented and verified
>
> **Priority:**
> - `Critical` — actual bug or broken behavior
> - `High` — significantly hurts UX or misleads users
> - `Medium` — noticeable gap, should be fixed
> - `Low` — polish / nice enhancement

---

## Audit Summary

All MVP, Later, and Nice-To-Have features are technically implemented. However, a detailed code audit found **real bugs**, placeholder/fake data in production, missing edge-case handling, weak UI polish, and under-utilized backend data.

---

## 0. Authentication & Auth Flow

**Current State:** Email/password + Google OAuth login, JWT stored in localStorage, context rehydration on mount, onboarding flow.

**Bugs & Problems Identified:**
- `AuthModals.tsx` L26-28: A side-effect (`setMode(initialMode)`) runs inside the render body — not in a `useEffect`. This can cause React warnings/infinite loops.
- No `isLoading` flag on `AuthContext` — between mount and async token validation, stale user data can briefly unlock protected routes.
- No global 401 Axios interceptor — when a JWT expires mid-session, the first API call silently fails with no logout or re-auth.
- `auth.service.ts` uses `any` types throughout — no typed request/response DTOs.
- Submit button in `AuthModals.tsx` always says "Continue" regardless of login vs register mode.
- No forgot password / password-reset flow anywhere in the codebase.
- No email verification — anyone can register with a fake email and use the platform immediately.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 0.1 | Move `setMode(initialMode)` from render body to a `useEffect` in `AuthModals.tsx` | Critical | Done |
| 0.2 | Add global Axios 401 interceptor to auto-logout when JWT expires | Critical | Done |
| 0.3 | Add `isLoading` state to `AuthContext` and block protected routes until auth resolves | High | Done |
| 0.4 | Change submit button label to "Sign In" vs "Create Account" based on mode | High | Done |
| 0.5 | Add forgot password flow (request reset email + reset-password page) | High | Not Started |
| 0.6 | Type `auth.service.ts` request/response interfaces (remove `any`) | Medium | Not Started |

---

## 1. Home Page (Landing Page)

**Current State:** Hero, search bar, hardcoded mock course cards, static testimonials, company logos, CTA section.

**Bugs & Problems Identified:**
- `Home.tsx` `FEATURED_COURSES` array: All featured course cards are **hardcoded fake data** — no connection to the real database. A visitor sees "Richard James" teaching 4 courses that may not exist.
- All 3 testimonials have **identical body text** — copy-paste artifact left in production.
- CTA section body text is Lorem Ipsum placeholder.
- No personalization for logged-in users.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 1.1 | Replace mock featured courses with real API call `GET /api/courses?limit=4&sort=rating` | High | Not Started |
| 1.2 | Replace identical testimonial texts with unique copy (or use real reviews from DB) | High | Not Started |
| 1.3 | Replace lorem ipsum CTA paragraph with real product copy | High | Not Started |
| 1.4 | Add platform stats banner: total students, total courses, total instructors (from a public stats endpoint) | Medium | Not Started |
| 1.5 | Personalize hero for logged-in users: "Welcome back, {name}!" with CTA to My Courses | Medium | Not Started |
| 1.6 | Add category/topic quick-links (Web Dev, Design, Business) that pre-filter the catalog | Low | Not Started |

---

## 2. User Profile Page

**Current State:** Shows name (editable), email (read-only), role (read-only). Three inputs and a save button.

**Bugs & Problems Identified:**
- `User` model has `avatar`, `bio`, `headline`, `interests`, `socialLinks` fields — none of these are exposed or editable on the Profile page.
- No avatar upload despite the file upload infrastructure existing.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 2.1 | Add avatar upload with image preview (reuse `FileUpload` component) | High | Not Started |
| 2.2 | Add editable bio and headline fields (model fields already exist) | High | Not Started |
| 2.3 | Add interests multi-select/tag editor so students can update recommendation preferences | High | Not Started |
| 2.4 | Add social links section for instructors (GitHub, LinkedIn, website) | Medium | Not Started |
| 2.5 | Add password change form (current password + new password + confirm) | Medium | Not Started |
| 2.6 | Show account joined date and account type badge | Low | Not Started |

---

## 3. Course Catalog / Course List Page

**Current State:** Search, level filter, sort dropdown, course card grid with pagination.

**Bugs & Problems Identified:**
- No skeleton loaders — blank screen during data fetch.
- No "no results" state with a helpful empty-state illustration.
- Free courses show no "Free" badge — only `$0` price which is easy to miss.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 3.1 | Add skeleton loader cards (shimmer placeholders) during initial data fetch | High | Not Started |
| 3.2 | Add empty state with illustration and helpful message when no results | High | Not Started |
| 3.3 | Add "Free" badge on course cards where `isPaid === false` | High | Not Started |
| 3.4 | Show total course duration on course cards (sum of lesson durations) | Medium | Not Started |
| 3.5 | Add price range filter (Free / Under $20 / Under $50 / Any) | Medium | Not Started |
| 3.6 | Add tag chip filters above the grid for one-click filtering | Medium | Not Started |
| 3.7 | Show enrolled student count on each course card | Low | Not Started |

---

## 4. Course Details Page

**Current State:** Hero, instructor card, curriculum accordion, description, FAQ, reviews.

**Bugs & Problems Identified:**
- **Fake subtitle** (L91-95 in `CourseDetailsPage.tsx`): Subtitle is hardcoded `'Beginner friendly starting point.'` / `'Intermediate level course.'` / `'Advanced level material.'` based only on level — not from the DB.
- **Fake old price** (L103): `oldPrice: (c.price * 1.5).toFixed(2)` — a 50% markup is computed client-side and shown as a fake strikethrough price that doesn't exist on the backend.
- **Student count always null** (L100): `studentCount: null` is hardcoded — `course.studentCount > 0` on L192 is always false, so enrollment count is never displayed.
- **Star rating selector is a `<select>` dropdown** — not interactive click-able stars.
- Loading state is plain text, no skeleton.
- Error state has no back button or recovery CTA.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 4.1 | Remove hardcoded `oldPrice` calculation — either add a real `comparePrice` field to Course model or remove the strikethrough entirely | Critical | Done |
| 4.2 | Fix `studentCount: null` — fetch real enrollment count from API and display it | Critical | Done |
| 4.3 | Remove hardcoded level-based subtitle — use the actual course description's first sentence or add a real `tagline` field | High | Done |
| 4.4 | Replace star rating `<select>` in review form with interactive click-able star icons | High | Done |
| 4.5 | Add skeleton loading state (hero, curriculum, reviews shimmer) | High | Not Started |
| 4.6 | Add rating distribution bar chart (★5: 60%, ★4: 25%, etc.) above review list | High | Not Started |
| 4.7 | Make curriculum sections collapsible/expandable | Medium | Not Started |
| 4.8 | Add total course duration summary next to lesson count in curriculum | Medium | Not Started |
| 4.9 | Add "What you'll learn" section that instructors can populate | Medium | Not Started |
| 4.10 | Add 404 error state with back button instead of bare red text | Medium | Not Started |

---

## 5. Lesson Viewer (Learning Page)

**Current State:** Split sidebar + content, 4 tabs, bookmark, mark-complete, quiz gate, prev/next.

**Bugs & Problems Identified:**
- **Fragile YouTube URL transform** (L390-391): `url.replace('watch?v=', 'embed/')` — breaks for playlist URLs, short URLs with query params (`youtu.be/id?list=...`), and already-embedded URLs. A proper regex or `URL` parser is needed.
- **Fixed PDF height** (L414): `style={{ height: '600px' }}` — completely broken on mobile screens.
- **"Mark as Complete" always shows** — even when the lesson is already completed. The sidebar shows a ✓ checkmark, but the lesson header still shows the full green "Mark as Complete" button. Inconsistent and confusing.
- **Progress percentage inconsistency**: `getMyCourseProgress` counts all lessons, but `getCourseProgressSnapshot` in the backend counts only mandatory lessons. The progress bar may show a different number than what triggers course completion.
- **Text content** (L442-444) renders as raw `whitespace-pre-wrap` text — no markdown support, no formatting.
- **No mobile sidebar toggle** — on small screens the curriculum sidebar is awkwardly stacked.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 5.1 | Fix YouTube embed URL transform — use a proper regex or URL-parsing function that handles all YouTube URL variants | Critical | Done |
| 5.2 | Fix PDF viewer height — replace fixed `600px` with responsive `min-h-[60vh] max-h-screen` or `aspect-[4/3]` | Critical | Done |
| 5.3 | Align backend progress calculation — use the same lesson set (all vs mandatory) in both `getMyCourseProgress` and `getCourseProgressSnapshot` | Critical | Not Started |
| 5.4 | Change "Mark as Complete" to show "✓ Completed" when lesson is already in `completedLessonIds` | High | Done |
| 5.5 | Add `react-markdown` (or `marked`) for text-type lesson content rendering | High | Not Started |
| 5.6 | Show lesson duration in sidebar next to each lesson title | High | Not Started |
| 5.7 | Show course completion modal/overlay at 100% with direct link to certificate | High | Not Started |
| 5.8 | Add mobile sidebar toggle button | Medium | Not Started |
| 5.9 | Show "X lessons left / ~Y min remaining" at top of sidebar | Medium | Not Started |
| 5.10 | Auto-advance to next lesson after marking complete (with 3-second countdown) | Low | Not Started |

---

## 6. Student Dashboard (My Courses)

**Current State:** Streak card, recently viewed, recommendations, in-progress/completed course grids.

**Bugs & Problems Identified:**
- **`window.confirm()`** used for unenroll confirmation — browser native dialog, inconsistent with the custom modal UI used everywhere else in the app.
- No "Resume" button directly linking to last accessed lesson.
- Enrollment cards show percentage text but no visual progress bar on the card itself.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 6.1 | Replace `window.confirm()` unenroll dialog with a proper `<Modal>` confirmation | Critical | Not Started |
| 6.2 | Add "Resume Learning →" button on each course card linking to `/learn/:courseId/:lastLessonId` | High | Not Started |
| 6.3 | Add visual progress bar on each enrolled course card | High | Not Started |
| 6.4 | Add illustrated empty state for students with 0 enrollments with CTA to browse courses | Medium | Not Started |
| 6.5 | Show completion date on completed course cards | Medium | Not Started |
| 6.6 | Show "Last lesson: {title}" subtitle on in-progress course cards | Medium | Not Started |

---

## 7. Enrollment Flow

**Current State:** Enroll button on course details, status check, toast on success.

**Bugs & Problems Identified:**
- **No auth guard on EnrollButton** — clicking "Enroll Now" while logged out triggers an API error and shows a confusing toast, instead of prompting login.
- **Paid course price not shown on button** — for paid courses, the button just says "Enroll Now" with no cost indication.
- No unenroll option in the enrollment flow itself.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 7.1 | Add auth guard to `EnrollButton` — show "Sign in to Enroll" for unauthenticated users that opens the auth modal | Critical | Not Started |
| 7.2 | Show "Continue Learning →" instead of "Enroll" when student is already enrolled (linking to last lesson) | High | Not Started |
| 7.3 | Show price on paid course enroll button (`Enroll for $29.99`) | High | Not Started |
| 7.4 | Show enrollment count on course details page ("Join 1,200+ students") | Medium | Not Started |
| 7.5 | Add unenroll option in My Courses (already exists) — make more discoverable | Low | Not Started |

---

## 8. Quiz & Assessment

**Current State:** Quiz creator, multiple-choice, pass/fail gate, retry option.

**Bugs & Problems Identified:**
- No per-question feedback after submitting — student only sees total score, not which questions were wrong.
- No attempt count shown — student doesn't know if they're on attempt 1 or attempt 10.
- No correct answer revealed after a failed attempt — student has no way to learn from mistakes.
- Retry just resets to a blank form with no context about the previous attempt.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 8.1 | Show per-question correct/incorrect indicators after quiz submission | High | Not Started |
| 8.2 | Reveal correct answers for wrong questions after a failed attempt | High | Not Started |
| 8.3 | Show attempt count before starting ("Attempt 3 of unlimited") | High | Not Started |
| 8.4 | Show last attempt score before retrying ("Your last score: 60% — need 70% to pass") | High | Not Started |
| 8.5 | Add question progress indicator inside quiz ("Question 2 of 5") | Medium | Not Started |
| 8.6 | Add configurable max attempt limit per quiz (instructor-controlled) | Low | Not Started |

---

## 9. Reviews & Ratings

**Current State:** Rating + text review form (enrolled only), average rating display, review list.

**Bugs & Problems Identified:**
- **Star rating `<select>` dropdown** — the rating input is a plain HTML `<select>` with options "1 Star" through "5 Stars". Interactive star icons are standard UX for ratings.
- Star rating field has no required validation — a review can be submitted with a rating of 0 or without choosing a star.
- No edit or delete for a review the student already submitted.
- No pagination — all reviews load at once, which will be slow for popular courses.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 9.1 | Replace `<select>` with interactive star-click rating component | High | Not Started |
| 9.2 | Make star rating required before review submission (frontend validation, min 1 star) | High | Not Started |
| 9.3 | Allow students to edit or delete their own review | High | Not Started |
| 9.4 | Add pagination/load-more on reviews (10 per page) | Medium | Not Started |
| 9.5 | Add sort controls (Most Recent / Highest / Lowest Rated) | Medium | Not Started |
| 9.6 | Show "Verified Enrollment" badge on reviews | Low | Not Started |

---

## 10. Instructor Course Management

**Current State:** Course list table, create/edit forms, curriculum builder, analytics, announcements, students list.

**Bugs & Problems Identified:**
- **N+1 API calls in `StudentsEnrolled.tsx`**: Fetches all instructor courses, then makes a separate `GET /courses/${courseId}/students` call for **each course** — 10 courses = 11 API requests on page load. Serious performance issue.
- **`CreateCourse.tsx` text content item**: The "Text Article" lesson item type uses `<input type="text">` — a single-line input for what should be multi-paragraph article content. Completely unusable for real articles.
- **No section/lesson delete** in the create flow — instructors can add but cannot remove sections or lessons in CreateCourse.
- **No section/lesson reorder** — no drag-and-drop or up/down arrows anywhere in the curriculum builder.
- **Inconsistent `isPaid`/price handling** between `CreateCourse.tsx` (uses `price: Number(price)` field only) and `EditCourse.tsx` (uses `isPaid` checkbox + separate price input). The same course data is handled differently.
- **Hardcoded Unsplash fallback thumbnail** (CreateCourse L77) baked into the API payload — if no thumbnail uploaded, every new course gets the same stock photo.
- **`EditCourse.tsx`** has no curriculum section — instructors can edit metadata and FAQs but cannot add/edit sections and lessons without going back to CreateCourse.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 10.1 | Replace N+1 calls in `StudentsEnrolled.tsx` with a single `GET /instructor/students` endpoint | Critical | Not Started |
| 10.2 | Replace `<input type="text">` for text content items with `<textarea>` (minimum) | Critical | Not Started |
| 10.3 | Add section and lesson delete buttons in the curriculum builder (with confirmation) | High | Not Started |
| 10.4 | Add section/lesson reordering with up/down arrow buttons | High | Not Started |
| 10.5 | Add curriculum editor tab to `EditCourse.tsx` (or link to the curriculum builder) | High | Not Started |
| 10.6 | Add "Preview Course" button in `EditCourse.tsx` linking to `/courses/:courseId` | High | Not Started |
| 10.7 | Show enrollment count and avg rating on each row in instructor My Courses table | Medium | Not Started |
| 10.8 | Allow instructors to self-unpublish their courses (return to draft) | Medium | Not Started |
| 10.9 | Remove hardcoded Unsplash fallback thumbnail — require thumbnail upload or default to a branded placeholder SVG | Low | Not Started |

---

## 11. Admin Dashboard

**Current State:** 5 number stat cards, pending courses table, users table, course moderation, enrollment list, audit logs.

**Bugs & Problems Identified:**
- **`isApproved: undefined` bug in `CourseModeration.tsx`** (L65): `course.isApproved !== false ? "Approved" : "Rejected"` — a newly submitted course with `isApproved: undefined` shows as "Approved". This is wrong: pending/unreviewed courses appear pre-approved in the UI.
- **All admin tables have no pagination** — loads every user, every course, every enrollment at once. Will fail or be very slow with real data.
- **No search on any admin table** — finding a specific user or course requires scrolling.
- **Admin can't preview course content** before approving — has no link to the course details page.
- **No rejection reason field** — rejecting a course gives no feedback to the instructor.
- **AdminDashboard stat cards are plain numbers** — no trends, no charts, no activity feed.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 11.1 | Fix `isApproved: undefined` bug — add explicit `"Pending"` status for courses where `isApproved` is `undefined` | Critical | Done |
| 11.2 | Add search input to Users Management table (filter by name/email/role) | High | Not Started |
| 11.3 | Add pagination to all admin tables (Users, Courses, Enrollments) | High | Not Started |
| 11.4 | Add "View Course" link in Course Moderation table so admin can preview before approving | High | Done |
| 11.5 | Add rejection reason text field when rejecting a course (shown to instructor) | High | Not Started |
| 11.6 | Add trend badges to admin stat cards ("+12 this week") | Medium | Not Started |
| 11.7 | Add enrollment/revenue chart (past 7 or 30 days) to Admin Dashboard | Medium | Not Started |
| 11.8 | Add search/filter to Course Moderation table | Medium | Done |

---

## 12. Notifications

**Current State:** Bell icon with unread count, notification list, mark-as-read.

**Bugs & Problems Identified:**
- Notifications are not clickable/actionable — clicking a notification does nothing, it doesn't route to the relevant course, lesson, or announcement.
- No "Mark all as read" button.
- Bell icon doesn't visually pulse or animate for new unread notifications.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 12.1 | Make notifications clickable — route to relevant content based on notification type (`/courses/:id`, `/learn/:courseId/:lessonId`, etc.) | High | Not Started |
| 12.2 | Add "Mark all as read" button in notification panel | High | Not Started |
| 12.3 | Add dismiss/delete on individual notifications | Medium | Not Started |
| 12.4 | Add pulsing animation on bell icon when there are unread notifications | Low | Not Started |

---

## 13. Certificates

**Current State:** Auto-issuance, unique certificate ID, verification page, PDF print.

**Bugs & Problems Identified:**
- My Certificates page has minimal styling — a plain list, no visual certificate card design.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 13.1 | Upgrade My Certificates page with visual certificate cards (thumbnail, completion date, verify/print links) | High | Not Started |
| 13.2 | Add "Share on LinkedIn" and "Copy verification link" buttons on the certificate verification page | Medium | Not Started |
| 13.3 | Add "Download as Image" export using `html2canvas` | Low | Not Started |

---

## Implementation Priority Order

### 🔴 Critical Bugs — Fix First

These are bugs that produce wrong data or broken behavior:

1. **11.1** — `isApproved: undefined` shows pending courses as "Approved" in admin
2. **4.1** — Fake `oldPrice` computed client-side shown as real strikethrough price
3. **4.2** — `studentCount: null` hardcoded — enrollment count never displays
4. **5.1** — Fragile YouTube URL embed transform (breaks many URL formats)
5. **5.2** — Fixed 600px PDF iframe height (broken on mobile)
6. **5.3** — Progress % inconsistency (all lessons vs mandatory lessons between two endpoints)
7. **0.1** — Side-effect in render body in `AuthModals.tsx`
8. **0.2** — No 401 interceptor — silent session expiry with no logout
9. **6.1** — `window.confirm()` for unenroll (inconsistent with UI)
10. **10.1** — N+1 API calls in `StudentsEnrolled.tsx`
11. **10.2** — Single-line `<input>` used for multi-paragraph text content items
12. **7.1** — No auth guard on EnrollButton (confusing error for unauthenticated users)

### 🟡 High-Impact UX — Do Next

13. **1.1, 1.2, 1.3** — Real courses on homepage, remove duplicate testimonials and lorem ipsum
14. **5.4** — "Mark as Complete" → "✓ Completed" when already done
15. **6.2, 6.3** — Resume button + progress bar on course cards
16. **9.1, 9.2** — Interactive star rating + required validation in reviews
17. **9.3** — Edit/delete own review
18. **8.1, 8.2, 8.3, 8.4** — Quiz: per-question feedback, correct answers, attempt count, last score
19. **12.1, 12.2** — Clickable notifications + mark all read
20. **4.4, 4.5** — Interactive star rating widget + course skeleton loading state
21. **10.3, 10.4** — Lesson/section delete + reorder in curriculum builder

### 🟢 Polish — Do When Time Allows

22. **2.1-2.3** — Profile avatar + bio + interests
23. **3.1, 3.2** — Skeleton loaders + empty states in course catalog
24. **5.5, 5.7** — Markdown rendering for text content + course completion overlay
25. **11.2-11.5** — Admin search, pagination, preview, rejection reason
26. **13.1, 13.2** — Certificate page cards + LinkedIn share
