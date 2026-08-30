# Feature Strengthening — Spec Index

Quick reference for all strengthening tasks by area.

| Area | Section | Total Tasks | Critical | High |
|---|---|---|---|---|
| Auth / Login Flow | [#0](feature-strengthening-plan.md#0-authentication--auth-flow) | 6 | 2 | 2 |
| Home Page | [#1](feature-strengthening-plan.md#1-home-page-landing-page) | 6 | 0 | 3 |
| User Profile | [#2](feature-strengthening-plan.md#2-user-profile-page) | 6 | 0 | 3 |
| Course Catalog | [#3](feature-strengthening-plan.md#3-course-catalog--course-list-page) | 7 | 0 | 3 |
| Course Details | [#4](feature-strengthening-plan.md#4-course-details-page) | 10 | 3 | 4 |
| Lesson Viewer | [#5](feature-strengthening-plan.md#5-lesson-viewer-learning-page) | 10 | 3 | 3 |
| Student Dashboard | [#6](feature-strengthening-plan.md#6-student-dashboard-my-courses) | 6 | 1 | 2 |
| Enrollment Flow | [#7](feature-strengthening-plan.md#7-enrollment-flow) | 5 | 1 | 2 |
| Quiz & Assessment | [#8](feature-strengthening-plan.md#8-quiz--assessment) | 6 | 0 | 4 |
| Reviews & Ratings | [#9](feature-strengthening-plan.md#9-reviews--ratings) | 6 | 0 | 3 |
| Instructor Management | [#10](feature-strengthening-plan.md#10-instructor-course-management) | 9 | 2 | 4 |
| Admin Dashboard | [#11](feature-strengthening-plan.md#11-admin-dashboard) | 8 | 1 | 4 |
| Notifications | [#12](feature-strengthening-plan.md#12-notifications) | 4 | 0 | 2 |
| Certificates | [#13](feature-strengthening-plan.md#13-certificates) | 3 | 0 | 1 |
| **Total** | | **92** | **13** | **37** |

## Critical Bugs (Fix First)

These are real bugs found during code audit that produce wrong behavior:

| Task | File | Bug |
|---|---|---|
| 11.1 | `CourseModeration.tsx:65` | `isApproved !== false` shows pending courses as "Approved" |
| 4.1 | `CourseDetailsPage.tsx:103` | `oldPrice = price * 1.5` — fake strikethrough price |
| 4.2 | `CourseDetailsPage.tsx:100` | `studentCount: null` hardcoded — enrollment count never shows |
| 5.1 | `LessonViewer.tsx:390` | Fragile YouTube URL transform — breaks many URL formats |
| 5.2 | `LessonViewer.tsx:414` | Fixed 600px PDF iframe — broken on mobile |
| 5.3 | `progressController.ts:269` | Progress % uses all lessons, snapshot uses mandatory only |
| 0.1 | `AuthModals.tsx:26` | Side-effect (`setMode`) runs in render body, not useEffect |
| 0.2 | `src/lib/api.ts` | No 401 interceptor — session expiry causes silent failures |
| 6.1 | `EnrollmentCard.tsx:35` | `window.confirm()` for unenroll — inconsistent with app UI |
| 10.1 | `StudentsEnrolled.tsx` | N+1 pattern — 1 request per course fetched serially |
| 10.2 | `CreateCourse.tsx:443` | `<input type="text">` used for multi-paragraph text content |
| 7.1 | `EnrollButton.tsx` | No auth guard — unauthenticated click causes confusing error |
| 1.2 | `Home.tsx:52-67` | All 3 testimonials have identical body text (copy-paste) |
| 1.3 | `Home.tsx:185` | Lorem ipsum placeholder in CTA section copy |

See [feature-strengthening-plan.md](feature-strengthening-plan.md) for full details, explanations, and all 92 tasks.
