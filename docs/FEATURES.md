# SkillKart - Feature Tracker

SkillKart is a MERN-based Learning Management System (LMS) for a college project. This file is now the feature index. Each feature has its own document so teammates can take ownership, update status, and implement collaboratively.

## Status Values

- `Not Started` - feature is planned but no implementation exists yet
- `In Progress` - implementation has started
- `Blocked` - waiting on another feature, decision, or fix
- `Review` - implementation is done and needs review/testing
- `Done` - implemented, tested, and accepted

## MVP Features

These should be built first because they make SkillKart work like a real LMS.

| Order | Feature | Status | Doc |
| --- | --- | --- | --- |
| 1 | User Authentication | In Progress | [docs/features/mvp/01-user-authentication.md](features/mvp/01-user-authentication.md) |
| 2 | Role-Based Access Control | In Progress | [docs/features/mvp/02-role-based-access-control.md](features/mvp/02-role-based-access-control.md) |
| 3 | Student Dashboard | In Progress | [docs/features/mvp/03-student-dashboard.md](features/mvp/03-student-dashboard.md) |
| 4 | Instructor Dashboard | In Progress | [docs/features/mvp/04-instructor-dashboard.md](features/mvp/04-instructor-dashboard.md) |
| 5 | Admin Dashboard | Not Started | [docs/features/mvp/05-admin-dashboard.md](features/mvp/05-admin-dashboard.md) |
| 6 | Course Management | In Progress | [docs/features/mvp/06-course-management.md](features/mvp/06-course-management.md) |
| 7 | Course Content Structure | In Progress | [docs/features/mvp/07-course-content-structure.md](features/mvp/07-course-content-structure.md) |
| 8 | Course Browsing | In Progress | [docs/features/mvp/08-course-browsing.md](features/mvp/08-course-browsing.md) |
| 9 | Enrollment System | In Progress | [docs/features/mvp/09-enrollment-system.md](features/mvp/09-enrollment-system.md) |
| 10 | Learning Page | In Progress | [docs/features/mvp/10-learning-page.md](features/mvp/10-learning-page.md) |
| 11 | Progress Tracking | In Progress | [docs/features/mvp/11-progress-tracking.md](features/mvp/11-progress-tracking.md) |
| 12 | Quiz and Assessment Basics | In Progress | [docs/features/mvp/12-quiz-and-assessment-basics.md](features/mvp/12-quiz-and-assessment-basics.md) |
| 13 | Reviews and Ratings | Not Started | [docs/features/mvp/13-reviews-and-ratings.md](features/mvp/13-reviews-and-ratings.md) |
| 14 | Certificates | Not Started | [docs/features/mvp/14-certificates.md](features/mvp/14-certificates.md) |
| 15 | Notifications | Not Started | [docs/features/mvp/15-notifications.md](features/mvp/15-notifications.md) |
| 16 | Basic File Handling | Not Started | [docs/features/mvp/16-basic-file-handling.md](features/mvp/16-basic-file-handling.md) |
| 17 | Data Validation and Error Handling | In Progress | [docs/features/mvp/17-data-validation-error-handling.md](features/mvp/17-data-validation-error-handling.md) |
| 18 | Security Essentials | In Progress | [docs/features/mvp/18-security-essentials.md](features/mvp/18-security-essentials.md) |

## Later Features

Useful after the MVP is stable.

| Feature | Status | Doc |
| --- | --- | --- |
| Wishlist | Not Started | [docs/features/later/wishlist.md](features/later/wishlist.md) |
| Announcements | Not Started | [docs/features/later/announcements.md](features/later/announcements.md) |
| Discussion or Comments | Not Started | [docs/features/later/discussion-comments.md](features/later/discussion-comments.md) |
| Advanced Instructor Analytics | Not Started | [docs/features/later/advanced-instructor-analytics.md](features/later/advanced-instructor-analytics.md) |
| Advanced Search | Not Started | [docs/features/later/advanced-search.md](features/later/advanced-search.md) |
| Notes and Bookmarks | Not Started | [docs/features/later/notes-bookmarks.md](features/later/notes-bookmarks.md) |
| Email Notifications | Not Started | [docs/features/later/email-notifications.md](features/later/email-notifications.md) |

## Nice-To-Have Features

Polish features for the final stage if time allows.

| Feature | Status | Doc |
| --- | --- | --- |
| Dark Mode | Not Started | [docs/features/nice-to-have/dark-mode.md](features/nice-to-have/dark-mode.md) |
| Course Tags | Not Started | [docs/features/nice-to-have/course-tags.md](features/nice-to-have/course-tags.md) |
| Instructor Public Profile | Not Started | [docs/features/nice-to-have/instructor-public-profile.md](features/nice-to-have/instructor-public-profile.md) |
| Student Learning Streaks | Not Started | [docs/features/nice-to-have/student-learning-streaks.md](features/nice-to-have/student-learning-streaks.md) |
| Course Recommendations | Not Started | [docs/features/nice-to-have/course-recommendations.md](features/nice-to-have/course-recommendations.md) |
| Recently Viewed Courses | Not Started | [docs/features/nice-to-have/recently-viewed-courses.md](features/nice-to-have/recently-viewed-courses.md) |
| Downloadable Certificate PDF | Not Started | [docs/features/nice-to-have/downloadable-certificate-pdf.md](features/nice-to-have/downloadable-certificate-pdf.md) |
| Admin Audit Logs | Not Started | [docs/features/nice-to-have/admin-audit-logs.md](features/nice-to-have/admin-audit-logs.md) |
| Bulk Upload Lessons | Not Started | [docs/features/nice-to-have/bulk-upload-lessons.md](features/nice-to-have/bulk-upload-lessons.md) |
| Course FAQ | Not Started | [docs/features/nice-to-have/course-faq.md](features/nice-to-have/course-faq.md) |

## Suggested Implementation Order

1. Project folder structure
2. Database models
3. Authentication
4. Role-based middleware
5. User profile APIs
6. Course CRUD
7. Lesson and section CRUD
8. Course browsing UI
9. Enrollment APIs
10. Student dashboard
11. Instructor dashboard
12. Learning page
13. Progress tracking
14. Admin dashboard
15. Reviews and ratings
16. Quiz basics
17. Certificate generation
18. Notifications
19. Final UI polish
20. Testing and bug fixes

## Core Database Models

- User
- Course
- Section
- Lesson
- Enrollment
- Progress
- Quiz
- Question
- QuizAttempt
- Review
- Certificate
- Notification

Optional later models:

- Wishlist
- Announcement
- Comment
- StudentNote
- AuditLog

## Out of Scope

- Live virtual classrooms
- Real-time chat
- Payment gateway integration
- Mobile application
- Complex subscription system
- AI course generation
- Proctored exams
- SCORM support
- Multi-tenant institution management
