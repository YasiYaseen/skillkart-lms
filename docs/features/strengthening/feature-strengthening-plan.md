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
| 1.1 | Replace mock featured courses with real API call `GET /api/courses?limit=4&sort=rating` | High | Done |
| 1.2 | Replace identical testimonial texts with unique copy (or use real reviews from DB) | High | Done |
| 1.3 | Replace lorem ipsum CTA paragraph with real product copy | High | Done |
| 1.4 | Add platform stats banner: total students, total courses, total instructors (from a public stats endpoint) | Medium | Done |
| 1.5 | Personalize hero for logged-in users: "Welcome back, {name}!" with CTA to My Courses | Medium | Done |
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
| 2.1 | Add avatar upload with image preview (reuse `FileUpload` component) | High | Done |
| 2.2 | Add editable bio and headline fields (model fields already exist) | High | Done |
| 2.3 | Add interests multi-select/tag editor so students can update recommendation preferences | High | Done |
| 2.4 | Add social links section for instructors (GitHub, LinkedIn, website) | Medium | Done |
| 2.5 | Add password change form (current password + new password + confirm) | Medium | Done |
| 2.6 | Show account joined date and account type badge | Low | Done |

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
| 3.1 | Add skeleton loader cards (shimmer placeholders) during initial data fetch | High | Done |
| 3.2 | Add empty state with illustration and helpful message when no results | High | Done |
| 3.3 | Add "Free" badge on course cards where `isPaid === false` | High | Done |
| 3.4 | Show total course duration on course cards (sum of lesson durations) | Medium | Done |
| 3.5 | Add price range filter (Free / Under $20 / Under $50 / Any) | Medium | Done |
| 3.6 | Add tag chip filters above the grid for one-click filtering | Medium | Done |
| 3.7 | Show enrolled student count on each course card | Low | Done |

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
| 5.3 | Align backend progress calculation — use the same lesson set (all vs mandatory) in both `getMyCourseProgress` and `getCourseProgressSnapshot` | Critical | Done |
| 5.4 | Change "Mark as Complete" to show "✓ Completed" when lesson is already in `completedLessonIds` | High | Done |
| 5.5 | Add clean styled markdown formatting for text-type lesson content rendering | High | Done |
| 5.6 | Show lesson duration in sidebar next to each lesson title | High | Done |
| 5.7 | Show course completion modal/overlay at 100% with direct link to certificate | High | Done |
| 5.8 | Add mobile sidebar toggle button | Medium | Done |
| 5.9 | Show "X lessons left / ~Y min remaining" at top of sidebar | Medium | Done |
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
| 6.1 | Replace `window.confirm()` unenroll dialog with a proper `<Modal>` confirmation | Critical | Done |
| 6.2 | Add "Resume Learning →" button on each course card linking to `/learn/:courseId/:lastLessonId` | High | Done |
| 6.3 | Add visual progress bar on each enrolled course card | High | Done |
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
| 7.1 | Add auth guard to `EnrollButton` — show "Sign in to Enroll" for unauthenticated users that opens the auth modal | Critical | Done |
| 7.2 | Show "Continue Learning →" instead of "Enroll" when student is already enrolled (linking to last lesson) | High | Done |
| 7.3 | Show price on paid course enroll button (`Enroll for $29.99`) | High | Done |
| 7.4 | Show enrollment count on course details page ("Join 1,200+ students") | Medium | Done |
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
| 8.1 | Show per-question correct/incorrect indicators after quiz submission | High | Done |
| 8.2 | Reveal correct answers for wrong questions after a failed attempt | High | Done |
| 8.3 | Show attempt count before starting ("Attempt 3 of unlimited") | High | Done |
| 8.4 | Show last attempt score before retrying ("Your last score: 60% — need 70% to pass") | High | Done |
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
| 9.1 | Replace `<select>` with interactive star-click rating component | High | Done |
| 9.2 | Make star rating required before review submission (frontend validation, min 1 star) | High | Done |
| 9.3 | Allow students to edit or delete their own review | High | Done |
| 9.4 | Add pagination/load-more on reviews (10 per page) | Medium | Not Started |
| 9.5 | Add sort controls (Most Recent / Highest / Lowest Rated) | Medium | Not Started |
| 9.6 | Show "Verified Enrollment" badge on reviews | Low | Done |

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
| 10.1 | Replace N+1 calls in `StudentsEnrolled.tsx` with a single `GET /instructor/students` endpoint | Critical | Done |
| 10.2 | Replace `<input type="text">` for text content items with `<textarea>` (minimum) | Critical | Done |
| 10.3 | Add section and lesson delete buttons in the curriculum builder (with confirmation) | High | Done |
| 10.4 | Add section/lesson reordering with up/down arrow buttons | High | Done |
| 10.5 | Add curriculum editor tab to `EditCourse.tsx` (or link to the curriculum builder) | High | Not Started |
| 10.6 | Add "Preview Course" button in `EditCourse.tsx` linking to `/courses/:courseId` | High | Done |
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
| 12.1 | Make notifications clickable — route to relevant content based on notification type (`/courses/:id`, `/learn/:courseId/:lessonId`, etc.) | High | Done |
| 12.2 | Add "Mark all as read" button in notification panel | High | Done |
| 12.3 | Add dismiss/delete on individual notifications | Medium | Not Started |
| 12.4 | Add pulsing animation on bell icon when there are unread notifications | Low | Done |

---

## 13. Certificates

**Current State:** Auto-issuance, unique certificate ID, verification page, PDF print.

**Bugs & Problems Identified:**
- My Certificates page has minimal styling — a plain list, no visual certificate card design.

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 13.1 | Upgrade My Certificates page with visual certificate cards (thumbnail, completion date, verify/print links) | High | Done |
| 13.2 | Add "Share on LinkedIn" and "Copy verification link" buttons on the certificate verification page | Medium | Done |
| 13.3 | Add "Download as Image" export using `html2canvas` | Low | Not Started |

---

## 14. Course Details Page — Remaining Gaps

**Current State (after strengthening):** Hero, instructor card, interactive star review, curriculum accordion, description, FAQ, reviews with edit/delete.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 14.1 | Add skeleton loading state (hero shimmer, curriculum shimmer, reviews shimmer) | High | Done |
| 14.2 | Add rating distribution bar chart (★5: 60%, ★4: 25%, etc.) above review list | High | Not Started |
| 14.3 | Make curriculum sections collapsible/expandable (accordion toggle per section) | Medium | Not Started |
| 14.4 | Add total course duration summary ("14h 30m total · 52 lessons") in curriculum header | Medium | Not Started |
| 14.5 | Add "What you'll learn" bullet list section (instructor-populated field on Course model) | Medium | Not Started |
| 14.6 | Add proper 404 error state with back button and "Browse Courses" CTA instead of bare red text | Medium | Done |
| 14.7 | Add reviews pagination (show 5, load more) to avoid slow load on popular courses | Medium | Not Started |
| 14.8 | Add sort controls on reviews (Most Recent / Highest / Lowest Rated) | Medium | Not Started |

---

## 15. Student Dashboard — Empty & Progress States

**Current State:** LearningStreakCard, RecentlyViewedCourses strip, In Progress / Completed grids, recommendations. Loading state uses shimmer skeleton cards.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 15.1 | Add skeleton loading cards while enrollments are fetching (4 shimmer cards) | High | Done |
| 15.2 | Add illustrated empty state with icon for students with 0 enrollments | Medium | Done |
| 15.3 | Show "Last lesson: {title}" subtitle on in-progress EnrollmentCards | Medium | Done |
| 15.4 | Show completion date on completed course EnrollmentCards | Medium | Done |
| 15.5 | Promote recommendations section above the course grids when there are 0 enrollments | Low | Not Started |

---

## 16. Instructor Dashboard & Analytics

**Current State:** 3 stat cards (enrollments, earnings, active courses), most-active-students table, quick actions, dark mode support.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 16.1 | Add dark mode support to instructor Dashboard | High | Done |
| 16.2 | Add enrollment trend spark-line or bar chart (past 7/30 days) to Dashboard | Medium | Not Started |
| 16.3 | Add "Quick Actions" shortcuts on Dashboard (Create Course, View Students, View Analytics) | Medium | Done |
| 16.4 | Show avg rating per course row in instructor MyCourses table | Medium | Not Started |
| 16.5 | Add instructor MyCourses table skeleton loading | Low | Not Started |

---

## 17. Admin Dashboard & Tables

**Current State:** 5 stat cards with dark mode and category icons, moderate courses and audit logs quick actions.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 17.1 | Add dark mode support to AdminDashboard stat cards | High | Done |
| 17.2 | Add search/filter to EnrollmentList table (by student name, course name, or status) | High | Not Started |
| 17.3 | Add pagination to all admin tables (Users, Courses, Enrollments) — loading all rows at once is not scalable | High | Not Started |
| 17.4 | Add rejection reason modal when admin rejects a course (text input, sent to instructor via notification) | High | Not Started |
| 17.5 | Add trend indicator badges to admin stat cards (e.g. "+12 this week") | Medium | Not Started |
| 17.6 | Add enrollment/revenue chart (past 7 or 30 days) to Admin Dashboard | Medium | Not Started |
| 17.7 | Add "View Course" quick-link in EnrollmentList rows | Low | Not Started |

---

## 18. Instructor Course Management — EditCourse & CreateCourse

**Current State:** EditCourse has metadata form + FAQ editor only. No curriculum editing. CreateCourse has curriculum builder. No "What you'll learn" field anywhere.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 18.1 | Add curriculum editor tab/section to `EditCourse.tsx` (link to curriculum builder or embed section/lesson editor) | High | Not Started |
| 18.2 | Add "What you'll learn" bullet list field to CreateCourse and EditCourse (stored on Course model) | Medium | Not Started |
| 18.3 | Allow instructor self-unpublish (toggle published → draft) from MyCourses — backend endpoint exists | Medium | Not Started |
| 18.4 | Remove hardcoded Unsplash fallback thumbnail in `MyCourses.tsx` — show branded SVG placeholder instead | Low | Not Started |
| 18.5 | Add character counter on Course Title and Description fields in both Create/Edit forms | Low | Not Started |

---

## 19. Notifications — Remaining Polish

**Current State:** Clickable notifications, "Mark all as read", pulsing bell. No individual dismiss, no empty state, no grouping.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 19.1 | Add individual dismiss (delete) button on each notification in the panel | Medium | Not Started |
| 19.2 | Add empty state illustration/message when notification panel has 0 notifications | Low | Not Started |
| 19.3 | Group notifications by date (Today / Yesterday / Older) for readability | Low | Not Started |

---

## 20. Certificates, Onboarding & Home

**Current State:** My Certificates page has visual cards. VerifyCertificate has LinkedIn share + copy link. Onboarding page is connected to `completeOnboarding` in `auth.service.ts`.

**Gaps Identified:**

| # | Task | Priority | Status |
|---|---|---|---|
| 20.1 | Clean up obsolete Onboarding stub and ensure full API integration | Critical | Done |
| 20.2 | Add "Download as Image" export using `html2canvas` on MyCertificatesPage or VerifyCertificatePage | Low | Not Started |
| 20.3 | Add home page category quick-links (Web Dev, Design, Business) that pre-filter the catalog | Low | Not Started |

---

## Implementation Priority Order

### 🔴 Critical Bugs — Fix First

All previously listed critical bugs are **Done** ✅. One new critical found:

1. ✅ **11.1** — `isApproved: undefined` shows pending courses as "Approved"
2. ✅ **4.1** — Fake `oldPrice` computed client-side
3. ✅ **4.2** — `studentCount: null` hardcoded
4. ✅ **5.1** — Fragile YouTube URL embed
5. ✅ **5.2** — Fixed 600px PDF height
6. ✅ **5.3** — Progress % inconsistency
7. ✅ **0.1** — Side-effect in render body
8. ✅ **0.2** — No 401 interceptor
9. ✅ **6.1** — `window.confirm()` for unenroll
10. ✅ **10.1** — N+1 API calls in StudentsEnrolled
11. ✅ **10.2** — Single-line input for text content
12. ✅ **7.1** — No auth guard on EnrollButton
13. **20.1** — `Onboarding.tsx` submits nothing to the backend (data silently discarded) | **Not Started**

### 🟡 High-Impact UX — Remaining

14. **14.1** — CourseDetailsPage skeleton loading (hero, curriculum, reviews shimmer)
15. **14.2** — Rating distribution bar chart above review list
16. **15.1** — Student MyCourses skeleton loading cards
17. **15.2** — Illustrated empty state for 0-enrollment dashboard
18. **15.3** — "Last lesson: {title}" on in-progress EnrollmentCards
19. **15.4** — Completion date on completed EnrollmentCards
20. **16.1** — Dark mode for instructor Dashboard
21. **17.1** — Dark mode for AdminDashboard stat cards
22. **17.2** — EnrollmentList search/filter
23. **17.3** — Pagination on all admin tables
24. **17.4** — Rejection reason modal when admin rejects course
25. **18.1** — Curriculum editor tab in EditCourse
26. **8.5** — Quiz question progress indicator ("Question 2 of 5")
27. **0.5** — Forgot password flow

### 🟢 Polish — Do When Time Allows

28. **5.10** — Auto-advance to next lesson with 3-second countdown
29. **9.4, 9.5** — Reviews pagination + sort (also **14.7, 14.8**)
30. **14.3, 14.4** — Collapsible curriculum sections + duration summary
31. **14.5** — "What you'll learn" section on CourseDetailsPage
32. **14.6** — 404 error state with back button on CourseDetailsPage
33. **16.2** — Enrollment trend chart on instructor Dashboard
34. **16.3** — Quick Actions on instructor Dashboard
35. **16.4** — Avg rating per course in instructor MyCourses
36. **17.5, 17.6** — Trend badges + enrollment chart on AdminDashboard
37. **18.2** — "What you'll learn" field in CreateCourse/EditCourse
38. **18.3, 18.4, 18.5** — Self-unpublish, thumbnail placeholder, char counters
39. **19.1** — Individual dismiss on notifications (also **12.3**)
40. **19.2, 19.3** — Notification empty state + date grouping
41. **13.3 / 20.2** — Download certificate as image
42. **20.3** — Home page category quick-links
43. **8.6** — Max attempt limit per quiz
