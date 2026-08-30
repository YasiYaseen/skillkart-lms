# SkillKart Feature Strengthening Plan

> **Purpose:** This document audits each core feature of SkillKart and identifies concrete improvements that will meaningfully raise UX quality, data integrity, and product polish — without adding entirely new subsystems.
>
> **Status Labels:**
> - `Not Started` — identified but no work done
> - `In Progress` — actively being worked on
> - `Done` — improvement implemented and verified

---

## Audit Summary

All MVP, Later, and Nice-To-Have features are technically implemented. However, several core areas have thin or placeholder content, missing edge-case handling, weak UI polish, or under-utilized data that could significantly improve the user experience.

---

## 1. Home Page (Landing Page)

**Current State:** Hero, search bar, hardcoded mock course cards, static testimonials, company logos, CTA section. The featured courses section shows **hardcoded mock data** — no connection to the real database.

**Problems Identified:**
- Featured course cards are static fake data (`FEATURED_COURSES` array in `Home.tsx`)
- Testimonials are entirely fake, all have identical text
- No stats section (e.g., "10,000 students", "120 courses") even if approximate
- CTA lorem ipsum placeholder body text exists on live page
- Not personalized at all — logged-in users see the exact same homepage as guests
- No category quick-links or topic shortcuts

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 1.1 | Replace mock featured courses with real API call to `GET /api/courses?limit=4&sort=rating` | High | Not Started |
| 1.2 | Add platform stats banner: total students, total courses, total instructors (pulled from admin stats or a public endpoint) | Medium | Not Started |
| 1.3 | Replace lorem ipsum placeholder in CTA section with real copy | High | Not Started |
| 1.4 | Add category/topic quick-links (e.g., Web Dev, Data Science, Design) that pre-filter the course catalog | Medium | Not Started |
| 1.5 | Personalize hero for logged-in users: show "Welcome back, {name}!" with link to My Courses instead of sign-up CTA | Medium | Not Started |

---

## 2. User Profile Page

**Current State:** Shows only `name` (editable), `email` (read-only), and `role`. No avatar, no bio, no headline, no interests, no social links, no password change.

**Problems Identified:**
- Can only edit name — nothing else meaningful is editable
- No avatar upload support despite the model having `avatar` field
- No way to update interests or skillLevel (important for recommendations)
- No password change flow
- No account deletion or data export option
- Profile looks like a stub form — 3 inputs and a save button

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 2.1 | Add avatar upload with image preview (reuse `FileUpload` component) | High | Not Started |
| 2.2 | Add editable bio and headline fields (exist in `User` model already) | High | Not Started |
| 2.3 | Add interests multi-select/tag editor so students can update recommendation preferences | High | Not Started |
| 2.4 | Add social links section for instructors (GitHub, LinkedIn, website) | Medium | Not Started |
| 2.5 | Add password change form (current password + new password + confirm) with proper server-side validation | Medium | Not Started |
| 2.6 | Show account joined date and account type badge | Low | Not Started |

---

## 3. Course Catalog / Course List Page

**Current State:** Search bar, level filter, sort dropdown, course card grid with pagination. Functional but basic.

**Problems Identified:**
- Search is keyword-only — no tag/category browsing
- No "No results found" illustration or helpful empty state
- No skeleton loaders — shows blank screen during fetch
- Course cards lack duration info (total hours)
- No "Free" badge on free courses — only price shown
- Price filter range is missing (users can't filter by `$0`, `< $20`, etc.)
- No category tabs (web dev, design, business, etc.) for quick filtering

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 3.1 | Add skeleton loader cards (4-8 shimmer placeholders) during initial fetch | High | Not Started |
| 3.2 | Add empty state illustration with helpful message and CTA when no courses match | High | Not Started |
| 3.3 | Add "Free" badge on course cards where `isPaid === false` | High | Not Started |
| 3.4 | Show total course duration (sum of lesson durations) on course cards | Medium | Not Started |
| 3.5 | Add price range filter (Free, Under $20, Under $50, Any) | Medium | Not Started |
| 3.6 | Add tag/category chip filters above the grid for quick one-click filtering | Medium | Not Started |
| 3.7 | Show enrolled student count on course cards | Low | Not Started |

---

## 4. Course Details Page

**Current State:** Good structure — hero, instructor card, curriculum accordion, description, FAQ accordion, reviews. Several gaps remain.

**Problems Identified:**
- "Enroll Now" button has no loading/pending state when API call is in progress
- No "Enrolled" confirmation state / enrolled badge shown after enrollment
- Curriculum section shows lesson count but no total duration summary
- Reviews section shows raw list but no rating distribution histogram (1-5 star breakdown)
- Write a review form only appears if enrolled — but no clear message explaining why if not enrolled
- Section headers in curriculum are not collapsible (everything is always expanded)
- No social share buttons
- No "Money Back Guarantee" or "What you'll learn" bullet points section

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 4.1 | Add rating distribution bar chart (★5: 60%, ★4: 25%, etc.) above review list | High | Not Started |
| 4.2 | Make curriculum sections collapsible/expandable (accordion behavior) | High | Not Started |
| 4.3 | Add total course duration summary next to lesson count in curriculum header | High | Not Started |
| 4.4 | Show clear "You must be enrolled to write a review" message with CTA if not enrolled | Medium | Not Started |
| 4.5 | Add "Enroll Now" button loading/disabled state during API call | Medium | Not Started |
| 4.6 | Add a "What you'll learn" section that instructors can populate | Medium | Not Started |
| 4.7 | Add "Share this course" social share buttons (copy link, Twitter, WhatsApp) | Low | Not Started |

---

## 5. Lesson Viewer (Learning Page)

**Current State:** Full-featured — sidebar curriculum, tabs (lesson, notes, discussion, announcements), bookmark button, mark as complete, quiz integration, prev/next navigation, progress bar. The richest page in the app.

**Problems Identified:**
- "Mark as Complete" button always visible even when lesson is already completed — should show "✓ Completed" state
- Video player has no keyboard shortcut hints or playback speed control
- Duration metadata per lesson is not shown in sidebar (just lesson title)
- No estimated time to complete indicator ("~45 min left")
- When course is 100% complete, no celebration animation or certificate prompt in-page
- Sidebar has no way to collapse on mobile without separate controls
- Text content (`text` type items) renders as raw whitespace-preserved text, not markdown

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 5.1 | Change "Mark as Complete" to show "✓ Completed" badge when lesson is already in `completedLessonIds` | High | Not Started |
| 5.2 | Show lesson duration in sidebar next to each lesson title | High | Not Started |
| 5.3 | Show congratulations modal/overlay when course reaches 100% with direct link to certificate | High | Not Started |
| 5.4 | Render text content as markdown using a lightweight renderer (e.g., `react-markdown`) | Medium | Not Started |
| 5.5 | Show "X lessons left" or "~Y min remaining" estimate at top of sidebar | Medium | Not Started |
| 5.6 | Add mobile-friendly sidebar toggle button (hamburger to show/hide curriculum on small screens) | Medium | Not Started |
| 5.7 | Preserve last active tab (`lesson`, `notes`, `discussion`) in `sessionStorage` so it doesn't reset on lesson change | Low | Not Started |

---

## 6. Student Dashboard (My Courses)

**Current State:** Good structure — learning streak card, recently viewed, recommendations, in-progress and completed course cards.

**Problems Identified:**
- Course cards in My Courses don't show the section/lesson the student was last on
- No quick "Resume" CTA button directly on each course card that links to the last lesson
- Enrolled courses show percentage but no visual progress ring or bar on the card itself
- Completed courses tab exists but looks identical to in-progress — no completion date shown
- No empty state for when a student hasn't enrolled in any courses yet
- Recommendations show even for students with no enrolled courses (could be confusing)

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 6.1 | Add "Resume Learning →" button on each course card linking to last lesson (`/learn/:courseId/:lastLessonId`) | High | Not Started |
| 6.2 | Add a visual progress bar on each enrolled course card | High | Not Started |
| 6.3 | Show completion date on completed course cards | Medium | Not Started |
| 6.4 | Add an illustrated empty state for students with 0 enrollments, with CTA to browse courses | Medium | Not Started |
| 6.5 | Show "Last lesson: {lesson title}" as subtitle on in-progress course cards | Medium | Not Started |
| 6.6 | Hide recommendations section and show "Start your first course to get personalized recommendations" when no enrollments exist | Low | Not Started |

---

## 7. Enrollment Flow

**Current State:** Enroll button exists on course details, handles paid course messaging. Basic.

**Problems Identified:**
- No enrollment confirmation page or modal — user is enrolled silently with just a toast
- Paid courses show a "Contact instructor" message but no actual payment flow (acceptable for now but needs a clearer "premium" explanation)
- No unenroll option for students who enrolled by mistake
- When already enrolled, button should say "Continue Learning" not just hide
- No enrollment count visible to prospective students ("2,340 students enrolled")

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 7.1 | Show "Continue Learning →" button (linking to lesson viewer) instead of "Enroll" when already enrolled | High | Not Started |
| 7.2 | Show total enrollment count prominently on course details page ("Join 1,200+ students") | Medium | Not Started |
| 7.3 | Add unenroll option in My Courses (with confirmation modal) | Medium | Not Started |
| 7.4 | Show enrollment success page/modal with next step CTA ("Start Learning Now") | Medium | Not Started |

---

## 8. Quiz & Assessment

**Current State:** Quiz editor for instructors, quiz gate blocking lesson completion, attempt tracking, scoring.

**Problems Identified:**
- Students see no explanation for wrong answers after attempting a quiz
- No retry limit controls — students can retry unlimited times with no cooldown
- Quiz results page/summary doesn't show which questions were wrong
- No quiz attempt history for students ("You scored 80% on your last attempt")
- Instructor cannot see overall quiz pass/fail rates from their dashboard
- No time limit support on quizzes

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 8.1 | Show correct answer explanation after quiz submission for wrong answers | High | Not Started |
| 8.2 | Display last attempt score on quiz component before starting ("Your last score: 60%") | High | Not Started |
| 8.3 | Show a quiz result summary view (question-by-question breakdown) after submission | Medium | Not Started |
| 8.4 | Add configurable max attempt limit per quiz (instructor setting) | Medium | Not Started |
| 8.5 | Show quiz pass rate analytics on instructor analytics page | Medium | Not Started |

---

## 9. Reviews & Ratings

**Current State:** Star rating input, text review, enrollment gate, average rating display.

**Problems Identified:**
- Students can submit a review without a star rating (rating defaults to 0)
- No edit or delete for a review the student already submitted
- Instructor cannot respond to reviews
- Reviews are not paginated — all reviews load at once
- Sort/filter reviews (most recent, highest, lowest) is missing

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 9.1 | Make star rating mandatory before review can be submitted (frontend validation) | High | Not Started |
| 9.2 | Allow students to edit or delete their own review | High | Not Started |
| 9.3 | Add pagination to reviews (10 per page) with "Load more" button | Medium | Not Started |
| 9.4 | Add sort controls to reviews (Most Recent, Highest Rated, Lowest Rated) | Medium | Not Started |
| 9.5 | Allow instructors to write a public reply to a student review | Low | Not Started |

---

## 10. Instructor Course Management

**Current State:** Course list page, create/edit course forms, section/lesson builders, analytics page, announcements, student list.

**Problems Identified:**
- My Courses list doesn't show key at-a-glance metrics per course (enrollment count, avg rating)
- No way to reorder sections or lessons (drag-and-drop or up/down arrows)
- Deleted course confirmation is instant without a modal
- Edit Course page shows FAQ editor at the bottom — but no curriculum/section editor (only CreateCourse has that)
- Instructor cannot unpublish a course themselves (only admins can via moderation)
- No "Preview as Student" button to see their course detail page as a student would

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 10.1 | Show enrollment count and average rating on each course card in instructor My Courses | High | Not Started |
| 10.2 | Add section/lesson reordering with up/down arrow buttons (or drag handle) | High | Not Started |
| 10.3 | Add "Preview Course" button in Edit Course page linking to `/courses/:courseId` | High | Not Started |
| 10.4 | Add curriculum/section editor tab to Edit Course page (same builder as Create) | Medium | Not Started |
| 10.5 | Allow instructors to unpublish their own published courses (return to draft) | Medium | Not Started |
| 10.6 | Add delete confirmation modal before removing a course | Medium | Not Started |

---

## 11. Admin Dashboard

**Current State:** Stats cards (total users, courses, enrollments, revenue), pending courses table, users table with status toggle, course status management.

**Problems Identified:**
- All stats are plain numbers — no trend indicators (up/down arrows vs. last week)
- Pending courses table has no preview link — admin can't see course content before approving
- No search/filter on the users table
- Admin cannot bulk-approve multiple courses at once
- No revenue chart over time (just a total number)
- No platform activity feed (recent enrollments, reviews, new users)

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 11.1 | Add "View Course" link in pending courses table so admin can preview before approving | High | Not Started |
| 11.2 | Add search/filter input to the users management table | High | Not Started |
| 11.3 | Add up/down trend badge to each stat card (e.g., "+12% this week") | Medium | Not Started |
| 11.4 | Add a simple bar/line chart for enrollments over the past 7 or 30 days | Medium | Not Started |
| 11.5 | Add rejection reason text field when admin rejects a course submission | Medium | Not Started |
| 11.6 | Add a "Recent Activity" feed showing latest enrollments, reviews, and new user signups | Low | Not Started |

---

## 12. Notifications

**Current State:** Notification bell with unread count, mark as read, list of notifications with type/message.

**Problems Identified:**
- Notifications are not clickable — they don't route to the relevant course/lesson/announcement
- No "Mark all as read" button
- No way to delete individual notifications
- No notification preferences (students can't opt out of announcement notifications)
- Bell icon doesn't animate/pulse when there are new unread notifications

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 12.1 | Make notifications clickable — route to relevant content (course, lesson, announcement) | High | Not Started |
| 12.2 | Add "Mark all as read" button in notification panel | High | Not Started |
| 12.3 | Add delete/dismiss button on individual notifications | Medium | Not Started |
| 12.4 | Add pulsing animation on bell icon when there are unread notifications | Low | Not Started |

---

## 13. Certificates

**Current State:** Auto-issued on course completion, unique certificate ID, verification page, PDF print support.

**Problems Identified:**
- My Certificates page exists but has minimal styling — just a list
- Certificate verification page works but no share button (copy link, LinkedIn share)
- No download as image option — only browser print
- Certificate card in My Certificates doesn't show course thumbnail

**Strengthening Tasks:**

| # | Task | Priority | Status |
|---|---|---|---|
| 13.1 | Upgrade My Certificates page with visual certificate cards (course thumbnail, completion date, verify link) | High | Not Started |
| 13.2 | Add "Share on LinkedIn" and "Copy verification link" buttons on certificate verification page | Medium | Not Started |
| 13.3 | Add "Download as Image" option using `html2canvas` or similar on the verification page | Low | Not Started |

---

## Implementation Priority Order

Based on frequency of use and impact on core user flows:

1. **5.1, 6.1, 6.2** — Lesson viewer completed state + student dashboard resume button (daily use, highest impact)
2. **7.1** — "Continue Learning" button replacing Enroll when already enrolled
3. **1.1** — Real courses on the homepage (first impression)
4. **4.1, 4.2** — Rating histogram + collapsible curriculum on course details
5. **9.1, 9.2** — Required star rating + edit/delete own review
6. **12.1, 12.2** — Clickable notifications + mark all read
7. **3.1, 3.2** — Skeleton loaders + empty states in course catalog
8. **2.1, 2.2, 2.3** — Profile avatar + bio + interests
9. **8.1, 8.2** — Quiz answer explanations + last score display
10. **10.1, 10.2, 10.3** — Instructor course list metrics + reorder + preview
