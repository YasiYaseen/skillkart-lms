# SkillKart LMS — UX, State-Synchronization & Multi-Role Inconsistency Audit Checklist

This audit checklist documents subtle UX, state-synchronization, and multi-role lifecycle inconsistencies across the SkillKart LMS codebase. Each item is classified by severity, mapped to affected roles and files, accompanied by concrete reproduction steps, and paired with an actionable remediation strategy.

---

## Severity Classification Framework

| Severity | Definition | Impact |
| :--- | :--- | :--- |
| **P0 — Critical / Blocker** | Lifecycle deadlocks, silent payment/order state corruption, or total lockout of paying users from course content. | Blocks core business flows, causes data desynchronization or trapped user states with no self-service recovery. |
| **P1 — High** | Conflicting lifecycle states across roles, phantom or failed API routes in core workflows, or security/moderation bypasses. | Directly misleads users or administrators, breaks key management screens, or bypasses business approval logic. |
| **P2 — Medium** | Misleading indicators, inaccurate progress metrics, missing lifecycle transitions, or cross-role permission blindspots. | Degrades user trust and operational visibility without fatally halting application usage. |
| **P3 — Low / Polish** | Redundant dead code, missing navigation exit points, or non-fatal catalog UI inconsistencies. | Visual confusion or minor friction in authoring/browsing journeys. |

---

## Summary of Identified Discrepancies

```
P0 (Critical / Blocker):
  [x] AUDIT-01: Rejected Course Resubmission Lifecycle Deadlock
  [x] AUDIT-02: Enrolled Paying Students Locked Out When Course Unpublished or Disabled
  [x] AUDIT-03: Order Checkout Allows Purchasing Unpublished, Draft, or Disabled Courses
  [x] AUDIT-04: Checkout Auto-Enrollment Leaves totalLessonsCount at 0 (Breaks Completion & Certs)
  [x] AUDIT-05: Unpublishing and Re-publishing Bypasses Admin Moderation Gate
  [x] AUDIT-20: Paid Course Direct Free Enrollment Bypass via Unvalidated Controller & Button
  [x] AUDIT-21: Instructor Self-Purchase & Cart Auto-Enrollment Revenue Loophole
  [x] AUDIT-71: Onboarding Role Selection Bypasses Instructor Moderation Workflow & Auto-Approval Policy
  [x] AUDIT-89: Empty Lesson Course Publication Allows White Screen of Death Crash in Student Viewer

P1 (High):
  [x] AUDIT-06: Phantom API Route `/courses/instructor` Breaks Assignments & Gradebook
  [x] AUDIT-07: Silent Route Failure `/instructor/courses` Clears Course Dropdown in Coupons
  [x] AUDIT-08: Admin Course Disabling Masks as "Live" with Active Toggle in Instructor Studio
  [x] AUDIT-09: Role Promotion Client-State Desync Bounces Approved Instructors to Homepage
  [x] AUDIT-10: Expired and Exhausted Coupons Render Active Green Badges and Pause Controls
  [x] AUDIT-22: Dead-End Route Desync on Approved Instructor Notification Link
  [ ] AUDIT-23: Public Instructor Profile Route 404 Endpoint Mismatch
  [ ] AUDIT-24: Permanent Course Archival Lifecycle Deadlock (Missing Unarchive Transition)
  [ ] AUDIT-25: Dangling Quiz, Attempt, and Assignment Entities on Course and Lesson Deletions
  [ ] AUDIT-26: Duplicate Order Checkout & Self-Enrollment Corrupts Student Records
  [ ] AUDIT-33: Unsubmitted Draft Courses Flooding Admin Moderation Queue with Active Disable/Enable Toggles
  [ ] AUDIT-34: Course Details Preview Renders Student Enrollment Actions Without Draft/Pending Indicator
  [ ] AUDIT-38: Wishlist Role Restriction Mismatch & Trapped State on Instructor/Admin Move to Wishlist
  [ ] AUDIT-40: Unenrolled Student Lesson Viewer Access Renders Broken Player and Throws 403 API Errors
  [ ] AUDIT-41: Mid-Course Lesson Additions Demote Completed Enrollments and Orphan Certificates
  [ ] AUDIT-47: Incomplete Cascading on Section Deletions Bypasses Lesson Count Sync and Leaves Dangling Prerequisites
  [ ] AUDIT-48: Platform Maintenance Mode Lacks Non-Checkout Mutation Route Guards (Data Corruption & State Leak)
  [ ] AUDIT-49: Disabled User Registration Lacks UI Indicator in Header & Auth Modals (Raw 403 Rejection)
  [ ] AUDIT-55: Lesson Viewer Last-Accessed Redirect Race Condition Overrides Student Resume Point
  [ ] AUDIT-56: Guest Cart Merging Omits Instructor Self-Course Filter
  [ ] AUDIT-61: Payout Status Machine Lacks Terminal State Guards Permitting Double Payout Disbursals
  [ ] AUDIT-62: Cancelled Enrollment Cart Lockout (Permanent Repurchase Block)
  [ ] AUDIT-63: Progress Mutation Route Split & Mandatory Quiz Gate Bypass
  [ ] AUDIT-64: Unenrollment Lifecycle Incompleteness (Ghost Certificates & Progress Desynchronization on Re-enrollment)
  [ ] AUDIT-67: Free Preview Lesson Architectural Disconnect (Stripped Media, Missing Authoring Toggle, & Viewer Crash)
  [ ] AUDIT-72: Silent Instructor Feedback Data Loss in Assignment Gradebook via Payload Key Mismatch
  [ ] AUDIT-74: Notification Deep-Link Dead End for Instructor Student Enrollments
  [ ] AUDIT-76: Google OAuth Password Setting Form Barrier & Schema Rejection
  [ ] AUDIT-78: Unhandled Instructor Demotion & Deactivation Lifecycle Cascade on Published Catalog Courses
  [ ] AUDIT-82: Order Checkout Bypasses Instructor Enrollment Notifications, Confirmation Emails, & Learning Streak Activity
  [ ] AUDIT-85: Admin Enrollment Oversight Table Drops Progress Percentage via Virtual Stripping & Lacks Server Pagination
  [ ] AUDIT-88: Category Filter Silently Overwritten by Search Queries and Unescaped Regex Crash
  [ ] AUDIT-90: Quiz Completion Gate Desynchronization on Non-Quiz Lesson Types and Initial Page Load

P2 (Medium):
  [ ] AUDIT-11: 0% Progress Invariant Violation Across All Students in Instructor Analytics
  [ ] AUDIT-12: Graded Assignment Form Permitting Resubmission and Corrupting Review State
  [ ] AUDIT-13: Instructor Application State Machine Lacks Withdrawal or Edit for Pending Applicants
  [ ] AUDIT-14: Course Deletion Omits Shopping Cart Pruning (Ghost Cart Items)
  [ ] AUDIT-15: Course Review Access Control Rejection for Cross-Role Learners (Instructors Taking Courses)
  [ ] AUDIT-16: Admin User Management Role Promotion Lacks User Notification & Course Cascading
  [ ] AUDIT-27: Quiz Completion Gate Desynchronization on Lesson Navigation & Page Reload
  [ ] AUDIT-28: Quiz Editor Strips Correct Answer for Instructors & Lacks Quiz Removal
  [ ] AUDIT-29: Deactivated / Banned Instructor Courses Remain Active in Marketplace Catalog
  [ ] AUDIT-30: Notes & Bookmarks Page Runtime Crash on Deleted Lessons
  [ ] AUDIT-35: Missing Instructor Payout Cancellation / Withdrawal Transition for Pending Requests
  [ ] AUDIT-36: Unpublished / Archived Courses Cause Confusing Student Experience Without Notification or Banner
  [ ] AUDIT-37: User Role Demotion / Update in User Management Desynchronizes Instructor Review Dossier Without Notification
  [ ] AUDIT-39: Wishlist Page Lacks Direct "Add to Cart" or Instant Purchase Action
  [ ] AUDIT-42: Course FAQs Expose Unapproved Course FAQs and Suffer Ordering Index Collisions on Deletions
  [ ] AUDIT-43: Public Certificate Verification Exposes Broken Navigation Wall and Hardcoded Verification Domain
  [ ] AUDIT-44: Course Generator Force-Regeneration Corrupts Student Progress Records and Quiz Attempts
  [ ] AUDIT-46: In-App Notification Deep Links Drop Users onto Video Player Tab with No Tab Context
  [ ] AUDIT-50: Learning Streak Lazy Expiry Gap (Ghost Streaks Displayed Post-Inactivity & Abrupt Drop)
  [ ] AUDIT-51: Admin Audit Log Filter Mismatches & Missing Pagination (Phantom Action Filters & Unreachable History)
  [ ] AUDIT-52: Category Deletion Foreign Key Orphanage & Missing Attached Courses Guard
  [ ] AUDIT-53: Bulk Lesson Upload Delimiter Naivety & Silent Discard of Failed Validation Rows
  [ ] AUDIT-57: Platform Promo Coupon Live Subsidy Capping Desynchronization
  [ ] AUDIT-58: Course Reviews Inaccessible for Archived or Unpublished Courses with Active Enrollments
  [ ] AUDIT-65: Lesson Discussion Indiscriminate Instructor Badge Masking Peer Learners as Course Instructors
  [ ] AUDIT-66: Lesson Viewer Redundant "Update" Button & Inability to Reset / Un-mark Completed Lessons
  [ ] AUDIT-68: Assignment Due Date Enforcement Void & Missing Late Submission Flagging
  [ ] AUDIT-69: Resubmission Request Notification Misclassification & Misleading "Success" Alert
  [ ] AUDIT-70: Multi-Role Assignment Rubric Criterion Score Boundary Desync
  [ ] AUDIT-73: Instructor Application Modal Crash for Students with Already Pending Applications
  [ ] AUDIT-75: Student Order History Schema Field Desync (`thumbnail` vs `thumbnailUrl`)
  [ ] AUDIT-77: AuthContext Desync on Profile Fetch Drops `instructorApplication` Historical State
  [ ] AUDIT-79: Hardcoded 80% Commission Copy in Instructor Earnings UI Desynchronized from System Settings
  [ ] AUDIT-80: Instructor Lesson Q&A Notification Routes to Student Learner Viewer Without Instructor Management Context
  [ ] AUDIT-81: Cart Coupon Discount Desynchronization on Cart Modification (Item Removal / Upsell Addition)
  [ ] AUDIT-83: Guest Cart Merging Drops Repurchasable Cancelled Enrollments
  [ ] AUDIT-84: Category Public Course Counts Omit Direct category Foreign Keys
  [ ] AUDIT-86: Student Course Unenrollment Leaves Instructors Blind Without Notification or Roster Update Event
  [ ] AUDIT-87: Instructor Payout Submission Lacks Audit Log and Notification Confirmation
  [ ] AUDIT-91: Instructor Students Enrolled Roster Misrepresents Cancelled Students as "In Progress" & Excludes Deactivated Courses
  [ ] AUDIT-92: Marketplace Course Listing Inflates Student Counts and Desynchronizes with Course Details
  [ ] AUDIT-93: Admin Course Disablement Operates Silently Without Instructor Notification or Appeal Path
  [ ] AUDIT-94: Course Deletion Wipes Active Student Enrollments and Earned Certificates Without Pre-Check or Notice

P3 (Low / Polish):
  [ ] AUDIT-17: Category Deletion and Inactivation Leaves Dangling References & Broken Catalog Filters
  [ ] AUDIT-18: Dead Code in `MyCourses.tsx` and Navigation Dead-End in `CreateCourse.tsx` Step 2
  [ ] AUDIT-19: Homepage CourseCard Omits Enrollment Check, Displaying Redundant "Add to Cart"
  [ ] AUDIT-31: Conflicting Instructor Revenue Metrics Between Analytics and Earnings Dashboards
  [ ] AUDIT-32: Course Details Page Sidebar Renders Student Purchase Actions for Course Owner
  [ ] AUDIT-45: Instructor Announcements Course Selector Lacks Lifecycle Status Indicators
  [ ] AUDIT-54: Hardcoded Payout Commission Model & Notification Currency Formatting Discrepancies
  [ ] AUDIT-59: Assignment Graded Notification Omits Deep-Link Tab Parameter
  [ ] AUDIT-60: Lesson Item Sequential Order Collision on Deletion & Lack of Reordering Interface
```

---

## Detailed Audit Items

### P0 — Critical / Blocker

#### [x] AUDIT-01: Rejected Course Resubmission Lifecycle Deadlock
- **Category**: Unhandled Lifecycle Transitions & Conflicting UI Indicators
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L489-L496)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L59-L62)
  - [`backend/src/routes/adminRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/adminRoutes.ts#L64)
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx#L128-L145,L308-L325)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx#L227-L245,L641-L690)
- **Description**:
  When an admin rejects a course, `course.isApproved` is set to `false`. In `EditCourse.tsx`, the rejection banner promises: *"You can edit your content, save changes, and submit again for moderation."* However, there is **zero submit, publish, or resubmit action** anywhere in `EditCourse.tsx`. In `MyCourses.tsx`, the toggle button is conditionally removed for rejected courses (`course.status === 'draft' && course.isApproved !== false`), leaving only a "Needs Changes" badge and an "Edit" button. Even if the instructor triggers `PATCH /courses/:courseId/publish`, `publishCourse` sets `status = "published"` but **never resets `isApproved` to undefined/null**. Consequently, the course never appears in the admin pending moderation badge count (`adminController.ts:59`), remains tagged as "Rejected" in `CourseModeration.tsx`, and is trapped in a permanent dead-end state.
- **Reproduction Steps**:
  1. Instructor creates and submits a course for moderation.
  2. Admin navigates to `/admin/courses` and clicks **Reject Course** with feedback: *"Add more exercises"*.
  3. Instructor navigates to `/instructor/courses`. Course displays "Needs Changes" badge; toggle button is missing.
  4. Instructor clicks **Edit** (`/instructor/courses/:id/edit`). The banner says *"submit again for moderation"*, but no submit/publish button exists.
  5. If instructor manually invokes `PATCH /api/courses/:id/publish`, the course status becomes `published`, but `isApproved` remains `false`.
  6. Admin visits `/admin/courses`: sidebar badge does not count it, and it remains filed under "Rejected".
- **Remediation & Resolution Summary**:
  - In `courseController.ts:publishCourse`, when `course.isApproved === false`, reset `course.isApproved = undefined` and `course.rejectionReason = undefined` so resubmitted courses re-enter admin moderation.
  - In `adminRoutes.ts` and `adminController.ts`, mapped `/courses/:courseId/moderation` to `updateCourseStatus` and handled `isApproved: null` state resets.
  - In `EditCourse.tsx`, added explicit **"Resubmit for Moderation"** action buttons with loading indicators and validation in both the rejection banner and the top header actions bar.
  - In `MyCourses.tsx`, rendered a dedicated **"Resubmit"** action button alongside "Edit" when `course.isApproved === false`, and updated local state to properly clear `isApproved` and `rejectionReason` on resubmission.

---

#### [x] AUDIT-02: Enrolled Paying Students Locked Out When Course Unpublished or Disabled
- **Category**: Mismatched Lifecycle States Between Admin, Instructor, and Student Views
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L338-L360)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L398-L412)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L85-L125,L255-L270)
- **Description**:
  In `courseController.ts:getCourseById`, the endpoint enforces `if (!isCoursePubliclyAccessible(course, requireApproval))` and immediately rejects non-instructors/non-admins with `403 Forbidden` **before** inspecting whether the requesting user has an active, paid enrollment. When an instructor temporarily sets a course to draft for curriculum updates or an administrator disables a course (`isActive: false`), paying students who load `LessonViewer.tsx` receive a `403 Forbidden` error (*"Failed to load course content"*), completely denying them access to lessons they paid for.
- **Reproduction Steps**:
  1. Student purchases and enrolls in Course A. Student accesses `/learn/:courseId` successfully.
  2. Instructor navigates to `/instructor/courses` and unpublishes Course A to revise a lesson description.
  3. Student refreshes `/learn/:courseId`.
  4. `GET /api/courses/:courseId` returns `403 Forbidden: Course is not publicly accessible`.
  5. The student is presented with a blank viewer and error toast.
- **Remediation & Resolution Summary**:
  - In `courseController.ts:getCourseById`, pre-computed manager status and verified active or completed enrollment (`Enrollment.exists({ student: req.user.id, course: course._id, status: { $in: ["active", "completed"] } })`) prior to evaluating `isCoursePubliclyAccessible`. Enrolled students and managers retain uninterrupted read access to course curriculum and lesson materials regardless of draft, unapproved, or disabled catalog states.
  - In `enrollmentController.ts:getCurriculumForCourse`, added enrollment verification so enrolled learners can continue loading course sections and lessons even when a course is unpublished or disabled.
  - In `LessonViewer.tsx`, expanded `ViewerCourse` typing to support lifecycle status (`status`, `isActive`), added a non-intrusive status banner informing enrolled students when a course is unpublished or under catalog review, and improved error handling to surface exact server error messages.

---

#### [x] AUDIT-03: Order Checkout Allows Purchasing Unpublished, Draft, or Disabled Courses
- **Category**: Mismatched Lifecycle States & State-Synchronization Leaks
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L50-L105)
  - [`backend/src/controllers/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cartController.ts#L88-L105,L228-L235)
  - [`frontend/src/context/CartContext.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/context/CartContext.tsx#L27-L32,L210-L245)
  - [`frontend/src/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/CartPage.tsx#L30-L35,L220-L230)
- **Description**:
  While `formatCartItems` in `cartController.ts` filters out non-public courses when rendering the cart page, `checkout` in `orderController.ts` directly queries `Course.find({ _id: { $in: validCourseIds } })` without checking `status === "published"`, `isActive !== false`, or `isApproved === true`. If a student already has a draft/disabled course ID in their cart or submits it directly to `POST /api/orders/checkout`, the system accepts payment, creates an order, and auto-enrolls the student in an unapproved or disabled course.
- **Reproduction Steps**:
  1. Student adds published Course B to cart.
  2. Platform Admin disables Course B via `/admin/courses` (`isActive: false`).
  3. Student submits checkout via `POST /api/orders/checkout`.
  4. The checkout query fetches Course B without status validation, deducts payment, creates order, and issues enrollment.
  5. Student attempts to access `/learn/:courseId` and is met with 403 Forbidden (see AUDIT-02).
- **Remediation & Resolution Summary**:
  - In `orderController.ts:checkout`, query courses with public accessibility attributes (`status`, `isActive`, `isApproved`) and evaluate each requested course against system moderation policies (`isCoursePubliclyAccessible(course, requireApproval)`).
  - Detected unpurchasable courses (unpublished, draft, disabled, unapproved, or missing) cause checkout to be rejected with `400 Bad Request` explicitly listing the unavailable course titles.
  - Automatically pruned unpurchasable course IDs from the student's database cart via `$pull` upon rejection.
  - In `cartController.ts:getCart`, automatically pruned unpurchasable or deleted course references from the user's cart in MongoDB, ensuring DB state and UI state remain synchronized.
  - In `CartContext.tsx`, exposed `refreshCart()` to synchronize client cart state with the backend cart.
  - In `CartPage.tsx:handleCheckout`, intercepted checkout rejection, invoked `refreshCart()`, reset the user to the items review step, and displayed the server's descriptive toast notification.

---

#### [x] AUDIT-04: Checkout Auto-Enrollment Leaves `totalLessonsCount` at 0 (Breaks Completion & Certs)
- **Category**: State-Synchronization & Lifecycle Transitions
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Instructor
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/course/shared.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/shared.ts)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts)
  - [`backend/src/models/Enrollment.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Enrollment.ts)
- **Description**:
  When auto-enrolling a user upon checkout, `orderController.ts` initializes the `Enrollment` model without calculating or setting `totalLessonsCount` (leaving it at default `0`). In `progressController.ts:updateLessonProgress`, course completion is gated on `const isFullyComplete = enrollment.totalLessonsCount > 0 && enrollment.completedLessonIds.length >= enrollment.totalLessonsCount`. Because `totalLessonsCount` is `0`, `isFullyComplete` is permanently `false`. As a result, the enrollment never transitions to `"completed"`, no Certificate is awarded, and the completion notification and email are never sent.
- **Reproduction Steps**:
  1. Student purchases a course through the checkout flow.
  2. Student completes every lesson in the course (e.g., 8 of 8 lessons).
  3. Inspect `Enrollment` document in database: `completedLessonIds.length` is 8, but `totalLessonsCount` is 0, and `status` remains `"active"`.
  4. Student opens `/my-certificates`; no certificate exists.
- **Remediation & Resolution Summary**:
  - Exported reusable helper `getCourseLessonCount(courseId)` in `backend/src/controllers/course/shared.ts` to compute accurate course lesson counts across all sections.
  - In `orderController.ts:checkout`, calculated `totalLessonsCount` dynamically for each purchased course and persisted it to the student's enrollment with atomic `$set` and `$setOnInsert` operators.
  - In `progressController.ts:updateLessonProgress`, added dynamic fallback healing to calculate and save `enrollment.totalLessonsCount` if missing or `<= 0` before checking completion gates, properly unlocking completion, certificate generation, notifications, and completion emails.
  - In `progressController.ts:getMyCourseProgress`, added self-healing for enrollments with `<= 0` lesson count and returned `isCompleted: enrollment.status === "completed"` flag for viewer modals.
  - In `enrollmentController.ts`, integrated `getCourseLessonCount` across `enrollInCourse`, `updateProgress`, `getMyEnrollments`, and `getCourseEnrollment` to self-heal existing legacy enrollments and prevent false 400 invalid state errors.
  - In `Enrollment.ts` model, enhanced `progressPercentage` virtual getter to safely clamp between 0% and 100% and avoid division-by-zero or undefined length issues.

---

#### [x] AUDIT-05: Unpublishing and Re-publishing Bypasses Admin Moderation Gate
- **Category**: Unhandled Lifecycle Transitions & Moderation Bypass
- **Priority**: `P0 — Critical`
- **Status**: `Completed`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L430-L465, L480-L540)
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx#L114-L165)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx#L245-L285, L690-L750)
  - [`frontend/src/features/instructor/pages/CreateCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/CreateCourse.tsx#L380-L395)
- **Description**:
  In `courseController.ts:unpublishCourse`, moving a course to draft sets `course.status = "draft"`, but leaves `course.isApproved` untouched (`true`). If the instructor then modifies curriculum, replaces videos, or inserts unauthorized content and clicks publish, `publishCourse` observes `course.isApproved === true` and immediately sets `status = "published"`. Even when platform settings have `requireCourseApproval: true`, the revisions go live instantly without ever entering the admin moderation queue.
- **Reproduction Steps**:
  1. Instructor submits Course C. Admin approves Course C (`isApproved: true`, `status: "published"`).
  2. Instructor clicks **Unpublish** in `/instructor/courses`. Status transitions to `"draft"`, but `isApproved` remains `true`.
  3. Instructor rewrites course content in `/instructor/courses/:id/edit`.
  4. Instructor publishes course. Course goes live immediately, bypassing admin approval.
- **Remediation & Resolution Summary**:
  - In `backend/src/controllers/course/courseController.ts:unpublishCourse`, enforced that moving a course to draft clears `isApproved` (`course.isApproved = undefined`) and `course.rejectionReason = undefined` whenever platform system settings require course approval (`requireCourseApproval !== false`).
  - In `backend/src/controllers/course/courseController.ts:publishCourse`, enforced that publishing from draft or rejected status sets `isApproved = undefined` (and clears `rejectionReason`) whenever `requireCourseApproval` is active and the actor is not an admin, returning `"Course submitted for review"` and guaranteeing re-entry into the admin moderation queue (`/admin/courses`). Added an idempotent check so already published and approved live courses retain their approved status without regressions.
  - In `backend/src/controllers/course/courseController.ts:updateCourse`, removed unvalidated `status` mutation from the generic field update loop and added strict transition guards mirroring the unpublish and publish validation checks.
  - In `frontend/src/features/instructor/pages/MyCourses.tsx`, captured the response course document in `togglePublish` on unpublish to synchronously reset `isApproved` and `rejectionReason` in component state, preventing the UI from retaining stale approved flags.
  - In `frontend/src/features/instructor/pages/EditCourse.tsx`, added dedicated `handlePublishOrSubmit` ("Submit for Review") and `handleUnpublishToDraft` ("Unpublish to Draft") actions to the header alongside state-synchronized status badges and moderation banners.
  - In `frontend/src/features/instructor/pages/CreateCourse.tsx`, updated `handlePublish` toast notification to dynamically consume backend response messaging rather than hardcoding immediate publication success.

---

### P1 — High

#### [x] AUDIT-06: Phantom API Route `/courses/instructor` Breaks Assignments & Gradebook
- **Category**: Phantom Actions & Route Mismatches
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor
- **Status**: Completed
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/Assignments.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Assignments.tsx#L80)
  - [`backend/src/routes/courseRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/courseRoutes.ts#L45)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L330)
- **Description**:
  In `Assignments.tsx:80`, the component loads instructor courses via `api.get('/courses/instructor')`. No such endpoint exists in `courseRoutes.ts`. Express matches the string `"instructor"` against `router.get("/:courseId", getCourseById)`. `getCourseById` checks `isValidObjectId("instructor")`, fails, and returns `400 Bad Request: "Invalid course id"`. The frontend catches this and shows a toast error: *"Invalid course id"*, leaving `selectedCourseId` empty and rendering the entire Assignments and Gradebook feature unusable.
- **Reproduction Steps**:
  1. Log in as an instructor.
  2. Navigate to `/instructor/assignments`.
  3. Red toast pops up: *"Invalid course id"*.
  4. Course selector dropdown remains empty and submission lists cannot be loaded.
- **Remediation & Resolution Summary**:
  - In `Assignments.tsx:80`, updated instructor course loading to call `api.get('/courses?mine=true')` matching other instructor views, handled both `{ courses: [...] }` and raw array response formats, and enhanced the course `<select>` element with disabled states and loading/empty fallback options.
  - In `backend/src/controllers/course/courseController.ts`, implemented and exported `getInstructorCourses` delegating to `getCourses` with `mine=true`, and added defensive interception in `getCourseById` for `"instructor"` to prevent `400 Invalid course id` errors.
  - In `backend/src/routes/courseRoutes.ts`, registered `router.get("/instructor", protect, authorize("instructor", "admin"), getInstructorCourses)` before `router.get("/:courseId", ...)` to ensure any direct calls to `/courses/instructor` route cleanly to instructor courses.

---

#### [x] AUDIT-07: Silent Route Failure `/instructor/courses` Clears Course Dropdown in Coupons
- **Category**: Phantom Actions & Route Mismatches
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor
- **Status**: Completed
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/Coupons.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Coupons.tsx#L60-L75)
  - [`backend/src/routes/instructorRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/instructorRoutes.ts#L18-L24)
- **Description**:
  In `Coupons.tsx:56`, the component queries `api.get('/instructor/courses').catch(() => ({ data: { courses: [] } }))`. The route `/instructor/courses` does not exist in `instructorRoutes.ts` (or anywhere in the backend). The 404 error is swallowed by the `.catch()`, silently populating `courses` with `[]`. When an instructor opens the "Create Coupon" modal and chooses to scope a promo to a specific course, the course dropdown is empty.
- **Reproduction Steps**:
  1. Log in as an instructor.
  2. Navigate to `/instructor/coupons` and click **Create Coupon**.
  3. Select coupon scope "Single Course".
  4. The course selector dropdown is empty despite the instructor having published courses.
- **Remediation & Resolution Summary**:
  - In `backend/src/routes/instructorRoutes.ts`, registered `router.get("/courses", protect, requireOnboardingCompleted, authorize("instructor", "admin"), getInstructorCourses)` so requests to `/api/instructor/courses` resolve cleanly and return instructor courses without 404 route failures.
  - In `frontend/src/features/instructor/pages/Coupons.tsx`, updated course fetching in `loadData` to query `api.get('/courses?mine=true')` with fallback to `/instructor/courses`, safely handled both `{ courses: [...] }` and raw array response formats, and supported both `_id` and `id` keys in the Course selector dropdown.


---

#### AUDIT-08: Admin Course Disabling Masks as "Live" with Active Toggle in Instructor Studio
- **Status**: `Completed`
- **Category**: Conflicting UI Indicators & Multi-Role Mismatches
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx)
  - [`frontend/src/features/admin/pages/CourseModeration.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CourseModeration.tsx)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts)
- **Description**:
  When an admin suspends a course by clicking "Disable" in `CourseModeration.tsx` (`course.isActive = false`), the admin sees a gray *"Disabled by Admin"* badge. However, `MyCourses.tsx` does not inspect `course.isActive`. If `course.status === 'published'`, it renders a bright green **"Live"** badge and an active toggle switch. The instructor believes their course is active and selling, while it is completely hidden from public catalogs and search results.
- **Reproduction Steps**:
  1. Admin opens `/admin/courses` and clicks **Disable** on an active course.
  2. Instructor logs in and opens `/instructor/courses`.
  3. The disabled course displays a green "Live" badge with an active status toggle.
  4. Instructor opens incognito browsing and searches for the course; it does not exist.
- **Remediation**:
  - In `MyCourses.tsx`, checked `course.isActive === false` to render disabled toggle button with informative tooltip alongside *"Suspended by Admin"* badge; guarded `togglePublish`, `handleResubmit`, and `handleRestore` against suspended courses.
  - In `EditCourse.tsx`, stored `isActive`, displayed *"Suspended by Admin"* header status badge, rendered prominent suspension warning banner, replaced publish/review/unpublish actions with disabled indicator, and guarded publish handlers.
  - In `courseController.ts`, guarded `publishCourse`, `unpublishCourse`, and `updateCourse` against modifying courses with `course.isActive === false` (403 Forbidden).
  - In `adminController.ts`, dispatched in-app notifications to course instructors when an administrator suspends or re-enables a course.

---

#### AUDIT-09: Role Promotion Client-State Desync Bounces Approved Instructors to Homepage
- **Status**: `Completed`
- **Category**: State-Synchronization & Multi-Role Transitions
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`frontend/src/features/auth/AuthContext.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/AuthContext.tsx)
  - [`frontend/src/features/auth/auth.api.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/auth.api.ts)
  - [`frontend/src/components/common/ProtectedRoute.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/ProtectedRoute.tsx)
  - [`frontend/src/components/common/NotificationBell.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/NotificationBell.tsx)
  - [`backend/src/routes/authRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/authRoutes.ts)
  - [`backend/src/controllers/auth/onboardingController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/onboardingController.ts)
- **Description**:
  `AuthContext.tsx` only fetches onboarding and user profile status during initial component mount. When an admin approves an instructor application in `InstructorReviews.tsx` or updates a role in `UserManagement.tsx`, a notification is generated: *"Instructor Application Approved! 🎉"* with link `/instructor`. The applicant clicks the notification or navigates to `/instructor`. However, the React state `user.role` remains `"student"`. `ProtectedRoute.tsx` checks `allowedRoles.includes(user.role)`, fails, and immediately redirects the user to `/`.
- **Reproduction Steps**:
  1. User applies for instructor role in tab A.
  2. Admin approves application in tab B.
  3. In tab A, user clicks the approval bell notification (*"Start creating courses"*).
  4. The router attempts to load `/instructor`.
  5. `ProtectedRoute` bounces user back to `/` because in-memory role is still `"student"`.
- **Remediation & Resolution Summary**:
  - In `backend/src/routes/authRoutes.ts`, added the canonical protected `router.get("/me", protect, getOnboardingStatus)` endpoint, and updated `getOnboardingStatus` in `backend/src/controllers/auth/onboardingController.ts` to include `avatar` and `isActive` alongside role and instructor application dossier fields.
  - In `frontend/src/features/auth/auth.api.ts`, exported `getMeApi` and enriched `AuthUser` with `isActive` and instructor application types.
  - In `frontend/src/features/auth/AuthContext.tsx`, enhanced `refreshUser` to return `Promise<User | null>`, querying `getMeApi()` with fallback to `getOnboardingStatusApi()`, saving fresh user data to state and `localStorage`.
  - In `frontend/src/components/common/ProtectedRoute.tsx`, implemented robust on-demand role verification: when an authenticated user attempts to access a route guarded by `allowedRoles` that their local `user.role` does not satisfy, `ProtectedRoute` enters a non-bouncing verifying state with a loading spinner, fetches live role status via `refreshUser()`, and seamlessly mounts `<Outlet />` if the promoted role matches, redirecting only if the live verified role still lacks authorization.
  - In `frontend/src/components/common/NotificationBell.tsx`, added proactive background sync on notification polling intervals if unread notifications indicate role transitions, and ensured `handleNotificationClick` awaits `refreshUser()` prior to routing to role-gated URLs.

---

#### [x] AUDIT-10: Expired and Exhausted Coupons Render Active Green Badges and Pause Controls
- **Category**: Misleading Status Badges & Conflicting UI Indicators
- **Priority**: `P1 — High`
- **Status**: `Completed`
- **Impacted Roles**: Instructor, Admin, Student
- **Affected Files**:
  - [`frontend/src/utils/couponUtils.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/utils/couponUtils.ts)
  - [`frontend/src/features/instructor/pages/Coupons.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Coupons.tsx)
  - [`frontend/src/features/admin/pages/AdminCoupons.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/AdminCoupons.tsx)
  - [`backend/src/controllers/couponController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/couponController.ts)
- **Description**:
  In both Instructor and Admin coupon dashboards, the status badge checks only `coupon.isActive ? 'Active' : 'Paused'`. If a coupon has passed its `expiresAt` timestamp or reached `timesRedeemed >= maxRedemptions`, it still renders a green "Active" pill and offers a "Pause" button. In metric cards, it counts towards "Currently Active". However, when a student attempts to use the coupon at checkout, validation fails with *"This coupon code has expired"* or *"reached its maximum redemption limit"*.
- **Reproduction Steps**:
  1. Create a coupon with `expiresAt` set to yesterday, or `maxRedemptions: 1` that was redeemed once.
  2. View `/admin/coupons` or `/instructor/coupons`.
  3. The coupon is badged as green "Active" and "Featured".
  4. Student types the code into `/cart` and receives an error that the coupon is expired.
- **Remediation & Resolution Summary**:
  - Created shared frontend utility `frontend/src/utils/couponUtils.ts` exporting `getCouponStatus` and `getCouponStatusBadgeConfig` to evaluate effective coupon lifecycle states (`'active' | 'expired' | 'exhausted' | 'paused'`).
  - Updated `Coupons.tsx` (Instructor) and `AdminCoupons.tsx` (Admin) to render distinct badges: Red *"Expired"*, Gray *"Exhausted"*, Amber *"Paused"*, and Green *"Active"*.
  - Fixed metric cards in both dashboards: "Currently Active" and "Featured on Cart" now count only genuinely active coupons instead of counting expired or exhausted coupons.
  - Disabled "Pause / Activate" toggle buttons on expired and exhausted coupons with explanatory tooltips, and added table "Edit" action in instructor studio to allow extending expiration dates or increasing limits.
  - Updated `backend/src/controllers/couponController.ts`: enriched coupon responses with computed `status` and `effectiveStatus`, guarded `updateCoupon` to reject activating or featuring expired/exhausted coupons without extending dates or limits, and fixed `getFeaturedCoupons` query `.select(...)` to include `maxRedemptions` and `timesRedeemed` so exhausted coupons are never exposed as featured offers on the cart.

---

### P2 — Medium

#### AUDIT-11: 0% Progress Invariant Violation Across All Students in Instructor Analytics
- **Category**: State-Synchronization & Data Integrity
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor
- **Affected Files**:
  - [`backend/src/controllers/instructor/instructorAnalyticsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorAnalyticsController.ts#L313, L335)
  - [`backend/src/models/Enrollment.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Enrollment.ts#L57-L63)
- **Description**:
  In `instructorAnalyticsController.ts:getInstructorStudents`, enrollments are fetched using `.lean()`: `Enrollment.find({ course: { $in: courseIds } })...lean()`. In Mongoose, calling `.lean()` strips all virtual getters. Because `progressPercentage` on `Enrollment` is defined solely as a virtual, `e.progressPercentage` evaluates to `undefined`. Line 335 executes `progressPercentage: e.progressPercentage || 0`. As a result, every enrolled student in the instructor's table displays **0% Progress**, even students who have finished every lesson.
- **Reproduction Steps**:
  1. Student completes 5 of 5 lessons in a course.
  2. Instructor navigates to `/instructor/students`.
  3. The student's "Progress" column reads `0%`.
- **Remediation**:
  - In `getInstructorStudents`, calculate `progressPercentage` directly from `e.completedLessonIds?.length` and `e.totalLessonsCount`:
    `const pct = e.totalLessonsCount > 0 ? Math.round(((e.completedLessonIds?.length || 0) / e.totalLessonsCount) * 100) : 0;`

---

#### AUDIT-12: Graded Assignment Form Permitting Resubmission and Corrupting Review State
- **Category**: Phantom Actions & Unhandled Lifecycle Transitions
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`frontend/src/features/student/components/CourseAssignmentsTab.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/components/CourseAssignmentsTab.tsx#L213, L330-L440)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L350-L366)
- **Description**:
  In `CourseAssignmentsTab.tsx`, when an assignment is already graded, the action button reads "View Submission". However, clicking it opens an editable form with an active file uploader, input fields, and a "Submit Project" button. If the student submits, `backend/src/controllers/assignmentController.ts:submitAssignment` does not check if the assignment was already graded. It upserts the document and sets `status = "submitted"`, but leaves the previous `score`, `rubricScores`, and `feedback` intact. The submission is now corrupted: it has status `"submitted"` (pending review) while simultaneously carrying a completed score and instructor feedback.
- **Reproduction Steps**:
  1. Instructor grades student project with score 95/100 and feedback *"Excellent work"*.
  2. Student opens `/learn/:courseId`, clicks Assignments tab, and clicks **View Submission**.
  3. Modal opens with an active form. Student changes repo link and clicks **Submit Project**.
  4. In instructor gradebook, the submission appears under "Pending Review", but displays a score of 95/100.
- **Remediation**:
  - In `CourseAssignmentsTab.tsx`, if `sub.status === 'graded'`, render the modal in read-only mode (hide submit button, disable inputs). Only allow editing if `sub.status === 'resubmission_requested'`.
  - In `assignmentController.ts:submitAssignment`, reject submission with `400 Bad Request` if `submission.status === 'graded'`.

---

#### AUDIT-13: Instructor Application State Machine Lacks Withdrawal or Edit for Pending Applicants
- **Category**: Unhandled Lifecycle Transitions
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Admin
- **Affected Files**:
  - [`backend/src/controllers/user/userController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/user/userController.ts#L278-L360)
  - [`frontend/src/pages/OnboardingPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/OnboardingPage.tsx#L142-L160)
- **Description**:
  When a student submits an instructor application (`user.instructorStatus = "pending"`), `applyForInstructor` blocks any future calls with *"You have already applied"*. If the applicant made a typo in their portfolio link, wishes to update their qualifications, or decides to withdraw their application, there is no withdrawal or edit endpoint/UI. The applicant is permanently frozen in pending state until an admin reviews them.
- **Reproduction Steps**:
  1. Student fills out instructor application on `/onboarding`.
  2. Student discovers an invalid portfolio URL.
  3. Student returns to `/onboarding`; form is locked with *"Application under review"*. No edit or withdraw button exists.
- **Remediation**:
  - Add `DELETE /api/users/instructor-application` to allow students to withdraw a pending application (`instructorStatus = 'none'`).
  - Add `PATCH /api/users/instructor-application` to update details while in `pending` status.

---

#### AUDIT-14: Course Deletion Omits Shopping Cart Pruning (Ghost Cart Items)
- **Category**: State-Synchronization & Data Integrity
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L563-L610)
  - [`backend/src/controllers/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cartController.ts#L49-L65)
- **Description**:
  In `courseController.ts:deleteCourse`, the handler cascades deletion to lessons, lesson items, comments, reviews, and enrollments, but completely omits `Cart`. Students who had the deleted course in their cart retain a dangling ObjectId in MongoDB `cart.items`. While `formatCartItems` filters out missing courses on GET, the ghost reference persists in the database forever.
- **Reproduction Steps**:
  1. Student adds Course X to cart.
  2. Instructor deletes Course X via `/instructor/courses`.
  3. Check database collection `carts`: student's cart still contains `items: [{ course: ObjectId("CourseX") }]`.
- **Remediation**:
  - In `courseController.ts:deleteCourse`, add `await Cart.updateMany({}, { $pull: { items: { course: courseId } } });`.

---

#### AUDIT-15: Course Review Access Control Rejection for Cross-Role Learners (Instructors Taking Courses)
- **Category**: Multi-Role Inconsistencies & Permission Blindspots
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`backend/src/routes/courseRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/courseRoutes.ts#L70-L72)
  - [`backend/src/controllers/course/reviewController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/reviewController.ts#L116-L120)
- **Description**:
  In `courseRoutes.ts`, review endpoints are protected with `authorize("student")`:
  `router.post("/:courseId/reviews", protect, requireOnboardingCompleted, authorize("student"), createCourseReview);`
  If an instructor or administrator enrolls in and completes a peer instructor's course, they are blocked by `authorize("student")` with `403 Forbidden`. In a multi-role LMS, instructors frequently learn from other instructors. Enrollment verification in `canReviewCourse` is already in place; restricting by static user role is an unnecessary barrier.
- **Reproduction Steps**:
  1. User with role `"instructor"` enrolls in a course taught by another instructor.
  2. User finishes the course and navigates to the course page to write a review.
  3. API responds with `403 Forbidden: You do not have permission to access this resource`.
- **Remediation**:
  - In `courseRoutes.ts:70-72`, change `authorize("student")` to `authorize("student", "instructor", "admin")`. Enrollment verification in `reviewController.ts:canReviewCourse` ensures only enrolled learners can submit reviews.

---

#### AUDIT-16: Admin User Management Role Promotion Lacks User Notification & Course Cascading
- **Category**: State-Synchronization & Multi-Role Transitions
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`frontend/src/features/admin/pages/UserManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/UserManagement.tsx#L296-L304)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L134-L206)
- **Description**:
  In `UserManagement.tsx`, clicking "Approve Instructor" invokes `PATCH /admin/users/:id/role`. Unlike `bulkApproveInstructors` in `adminController.ts:250`, this endpoint does not generate an in-app notification for the user. Furthermore, if an administrator downgrades an instructor with published courses to `"student"`, the courses remain live and purchasable in the marketplace, but the user is stripped of instructor access, orphaning the courses from author management.
- **Reproduction Steps**:
  1. Admin opens `/admin/users` and upgrades a student to instructor via role dropdown.
  2. User never receives a notification confirming approval.
  3. Admin downgrades an instructor with live courses to student. Courses stay active in catalog, but the instructor can no longer manage them.
- **Remediation**:
  - In `adminController.ts:updateUserRole`, create an in-app notification when a user's role is updated.
  - If an instructor is demoted, prompt the admin or automatically unpublish their courses to avoid orphaned live content.

---

### P3 — Low / Polish

#### AUDIT-17: Category Deletion and Inactivation Leaves Dangling References & Broken Catalog Filters
- **Category**: State-Synchronization & Catalog Data Integrity
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Admin, Student
- **Affected Files**:
  - [`backend/src/controllers/category/categoryController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/category/categoryController.ts#L17-L23, L190-L207)
  - [`frontend/src/features/admin/pages/CategoryManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CategoryManagement.tsx#L175-L188)
- **Description**:
  In `categoryController.ts:deleteCategory`, `Category.findByIdAndDelete` deletes the category document without checking if active courses reference it, leaving orphaned `course.category` ObjectIds. Furthermore, when an admin deactivates a category (`isActive = false`), public `getCategories` hides the category pill, but courses assigned to it still exist with that category ID, creating inconsistencies in catalog faceted filtering.
- **Reproduction Steps**:
  1. Admin creates Category "DevOps" and assigns 3 courses.
  2. Admin deletes "DevOps" in `/admin/categories`.
  3. Courses still hold `category: ObjectId("DevOps")`. When populated, `category` is `null`.
- **Remediation**:
  - Prevent deleting categories that have associated courses (`courseCount > 0`). Require re-assigning courses first, or unset `category` on affected courses.

---

#### AUDIT-18: Dead Code in `MyCourses.tsx` and Navigation Dead-End in `CreateCourse.tsx` Step 2
- **Category**: Phantom Actions & Navigation Dead Ends
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Instructor
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx#L8-L52)
  - [`frontend/src/features/instructor/pages/CreateCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/CreateCourse.tsx#L50, L1020-L1065)
- **Description**:
  In `MyCourses.tsx`, lines 8–52 contain an unused `getCourseStatusBadge` function (superseded by inline badge rendering). In `CreateCourse.tsx`, the `navigate` hook is declared on line 50 but unused. At the bottom of Step 2 (curriculum builder), there is no primary action button ("Finish & Go to Courses" or "Review & Publish"), leaving instructors stranded at the bottom of the section list with no obvious way to proceed.
- **Reproduction Steps**:
  1. Instructor creates a new course in `/instructor/create-course`.
  2. Step 1 completes and advances to Step 2 (Curriculum Builder).
  3. Instructor adds sections and lessons, then scrolls to the bottom. No "Done", "Save", or "Continue" button is present.
- **Remediation**:
  - Remove dead `getCourseStatusBadge` code from `MyCourses.tsx`.
  - Add a primary footer bar in `CreateCourse.tsx` Step 2 with buttons: *"Save & Exit to Courses"* and *"Proceed to Edit & Publish"*.

---

#### AUDIT-19: Homepage CourseCard Omits Enrollment Check, Displaying Redundant "Add to Cart"
- **Category**: Conflicting UI Indicators
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`frontend/src/pages/Home.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/Home.tsx#L224-L232)
  - [`frontend/src/components/common/CourseCard.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/CourseCard.tsx#L43-L52)
- **Description**:
  In `Home.tsx`, top courses and recommended courses are rendered using `<CourseCard>` without passing `isEnrolled`. When an enrolled student visits the home page, courses they already own display "Add to Cart" or "Enroll Now" buttons instead of "Continue Learning". Clicking "Add to Cart" adds the already-enrolled course to the cart.
- **Reproduction Steps**:
  1. Student enrolls in Course A.
  2. Student navigates to `/` (Home page).
  3. Course A displays *"Add to Cart"*. Clicking it puts Course A in the shopping cart.
- **Remediation**:
  - In `Home.tsx`, fetch or match the user's enrolled course IDs and pass `isEnrolled={enrolledCourseIds.includes(course._id)}` to `<CourseCard>`.

---

#### [x] AUDIT-20: Paid Course Direct Free Enrollment Bypass via Unvalidated Controller & Button
- **Category**: Security & Monetization Bypass
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L48-L60)
  - [`frontend/src/features/enrollment/components/EnrollButton.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/enrollment/components/EnrollButton.tsx)
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L840-L850)
- **Description**:
  In `enrollmentController.ts:enrollInCourse`, the backend verifies course existence, active status, public accessibility, and ensures `course.instructor !== req.user.id`. However, it never checks whether the course is paid (`course.isPaid === true` or `course.price > 0`). Furthermore, on the frontend, `EnrollButton.tsx` renders "Enroll Now for $XX" when `isPaid && price`, but `handleEnrollClick` directly invokes `api.post('/enrollments', { courseId })` instead of routing the student to cart or instant checkout. Any user can acquire free, full lifetime enrollment into any paid course on SkillKart either by clicking the button or sending a direct POST request to `/api/enrollments`.
- **Reproduction Steps**:
  1. Instructor creates and publishes a paid course with `price = 99.99` and `isPaid = true`.
  2. Student navigates to the course page or executes `curl -X POST /api/enrollments -H "Authorization: Bearer <token>" -d '{"courseId":"<id>"}'`.
  3. `POST /api/enrollments` responds with `201 Created` and enrolls the student for $0 without creating an `Order` or processing payment.
- **Remediation & Resolution Summary**:
  - In `backend/src/controllers/enrollment/enrollmentController.ts:enrollInCourse`, added a payment validation guard returning `402 Payment Required` (`"This is a paid course. Please complete checkout to enroll."`) when `course.isPaid` is true or `course.price > 0`, while preserving idempotent 200 OK access for already active/completed enrollments and preventing cancelled reactivation exploits for paid courses.
  - In `frontend/src/features/enrollment/components/EnrollButton.tsx`, integrated `useCart` and `useNavigate` to detect paid courses, automatically adding the course to the student's cart if not already present and routing directly to checkout (`/cart?step=payment`) instead of calling the free enrollment endpoint. Added `redirecting` state feedback and expanded props to pass full course metadata.
  - In `frontend/src/pages/courses/CourseDetailsPage.tsx`, passed `title`, `thumbnailUrl`, and `instructorName` into `EnrollButton` ensuring clean line-item data in the cart on checkout transition.

---

#### [x] AUDIT-21: Instructor Self-Purchase & Cart Auto-Enrollment Revenue Loophole
- **Category**: Monetization, Accounting & State-Synchronization Leaks
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cartController.ts)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts)
  - [`frontend/src/context/CartContext.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/context/CartContext.tsx)
  - [`frontend/src/features/enrollment/components/EnrollButton.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/enrollment/components/EnrollButton.tsx)
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx)
  - [`frontend/src/components/common/CourseCard.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/CourseCard.tsx)
- **Description**:
  In `cartController.ts:addToCart`, the query `Course.findById(courseId)` omits selecting `instructor`, and only checks whether the user is already enrolled (`Enrollment.exists`). It does not verify whether `course.instructor.toString() === req.user.id`. An instructor can add their own course to the cart and execute `checkout` via `orderController.ts:checkout`. Checkout calculates instructor payout (80% by default) and platform fee, creates an order crediting the instructor with earnings from purchasing their own course, and upserts an `Enrollment` record for the instructor. This corrupts platform financial ledgers, inflates student numbers, and allows instructors to manipulate payout balances.
- **Reproduction Steps**:
  1. Instructor logs in and visits their own course details page or calls `POST /api/cart` with their own `courseId`.
  2. The course is added to their cart with `200 OK`.
  3. Instructor calls `POST /api/orders/checkout`.
  4. An order is created with `instructorPayout` credited to the instructor, and an `Enrollment` document is created with the instructor as `student`.
- **Remediation & Resolution Summary**:
  - In `backend/src/controllers/cartController.ts:addToCart`, selected `instructor` on `Course.findById` and enforced `if (course.instructor && course.instructor.toString() === req.user.id) return res.status(400).json({ message: "Instructors cannot purchase their own courses." });`.
  - In `backend/src/controllers/cartController.ts:getCart` and `formatCartItems`, filtered out and pruned self-authored courses from the student's database cart so instructors never retain their own courses in cart.
  - In `backend/src/controllers/orderController.ts:checkout`, validated that no courses in the order are authored by the purchasing user; if detected, auto-prunes those course IDs from the user's cart in MongoDB and aborts order creation with `400 Bad Request`.
  - In `frontend/src/context/CartContext.tsx:addToCart`, rolled back optimistic cart state on server rejection, displayed toast error, and re-threw the error for callers.
  - In `frontend/src/features/enrollment/components/EnrollButton.tsx`, guarded checkout redirection so failures during `addToCart` do not redirect to checkout.
  - In `frontend/src/pages/courses/CourseDetailsPage.tsx` and `frontend/src/components/common/CourseCard.tsx`, handled `addToCart` promise rejections cleanly and prevented false success toasts or checkout transitions.

---

#### [x] AUDIT-22: Dead-End Route Desync on Approved Instructor Notification Link
- **Category**: Broken Navigation & Route Desynchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L280-L295)
  - [`frontend/src/App.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/App.tsx#L1,L87-L89)
- **Description**:
  When a platform administrator approves an instructor application in `adminController.ts:bulkApproveInstructors`, an automated notification is created with `link: "/instructor/dashboard"`. However, in `frontend/src/App.tsx`, the instructor studio route is mounted at `/instructor` (with sub-routes `courses`, `analytics`, `earnings`, and `create-course`). There is NO route for `/instructor/dashboard` and no wildcard or redirect configured in `App.tsx`. When the approved user clicks the notification in their notification drawer, the router navigates to `/instructor/dashboard`, which fails to match any route, resulting in a completely blank screen with no user feedback.
- **Reproduction Steps**:
  1. Student submits an application to become an instructor via `/profile`.
  2. Admin navigates to `/admin/instructors` and approves the application.
  3. User receives a notification: *"Instructor Application Approved"*.
  4. User clicks the notification. The browser navigates to `/instructor/dashboard`.
  5. The screen is completely blank because the route does not exist.
- **Remediation & Resolution Summary**:
  - In `backend/src/controllers/admin/adminController.ts:bulkApproveInstructors`, corrected the approval notification payload link from `"/instructor/dashboard"` to `"/instructor"`.
  - In `frontend/src/App.tsx`, added a fallback redirect route `<Route path="/instructor/dashboard" element={<Navigate to="/instructor" replace />} />` within the protected Instructor layout, guaranteeing existing notifications or direct bookmarks seamlessly redirect to `/instructor` without blank screen errors.

---

#### AUDIT-23: Public Instructor Profile Route 404 Endpoint Mismatch
- **Category**: Broken Endpoints & Catalog Inconsistencies
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`frontend/src/pages/InstructorPublicProfile.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/InstructorPublicProfile.tsx#L70)
  - [`backend/src/routes/userRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/userRoutes.ts#L32)
  - [`backend/src/server.ts`](file:///c:/Users/user/projects/skillkart/backend/src/server.ts#L55, L61)
  - [`backend/src/controllers/user/userController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/user/userController.ts#L95-L103)
- **Description**:
  In `InstructorPublicProfile.tsx`, the component requests `api.get('/instructors/${instructorId}/public-profile')`. In `server.ts`, userRoutes is mounted at `/api/users` and instructor studio routes at `/api/instructor`. There is no `/api/instructors` router defined anywhere in Express. The actual public profile endpoint in `userRoutes.ts` is `GET /api/users/instructor/:instructorId`. Because of this path mismatch, any click on an instructor's name anywhere on SkillKart (course detail pages, course cards, review headers) navigates to `/instructors/:instructorId` and permanently fails with `404 Not Found`, displaying "Failed to load instructor profile". Additionally, `userController.ts:getPublicInstructorProfile` hardcodes `isApproved: true`, returning 0 courses if `requireCourseApproval` is disabled globally in `SystemSettings`.
- **Reproduction Steps**:
  1. As a student or guest, open any course details page (`/courses/:courseId`).
  2. Click on the instructor's name link (e.g., `/instructors/65...`).
  3. The page attempts `GET /api/instructors/65.../public-profile`, which returns `404 Cannot GET /api/instructors/...`.
  4. An error banner displays: *"Failed to load instructor profile"*.
- **Remediation**:
  - In `InstructorPublicProfile.tsx:70`, change the endpoint to `api.get('/users/instructor/${instructorId}')` (or add an alias route in Express: `app.use('/api/instructors', ...)`).
  - In `userController.ts:getPublicInstructorProfile`, respect global `requireCourseApproval` system settings when querying courses rather than hardcoding `isApproved: true`.

---

#### AUDIT-24: Permanent Course Archival Lifecycle Deadlock (Missing Unarchive Transition)
- **Category**: Unhandled Lifecycle Transitions & State Lockouts
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L534-L561)
  - [`backend/src/routes/courseRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/courseRoutes.ts#L114-L119)
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx#L300-L305)
- **Description**:
  The course status lifecycle supports `["draft", "published", "archived"]`. `courseController.ts` provides `archiveCourse` via `PATCH /:courseId/archive`. However, there is no `unarchiveCourse` controller or endpoint in `courseRoutes.ts`. In `MyCourses.tsx`, when a course is archived, it displays a static gray "Archived" badge, and the action menu omits any "Unarchive", "Restore", or "Publish" options. Once an instructor or administrator archives a course, it is permanently trapped in the archived state with no UI action or API route to restore it to draft or published status.
- **Reproduction Steps**:
  1. Instructor creates and publishes a course.
  2. Instructor archives the course via the course action menu. Course status becomes `"archived"`.
  3. Course list in `/instructor/courses` displays the course as "Archived".
  4. There are no controls to unarchive or move it back to draft.
  5. The course cannot be resurrected without direct database intervention.
- **Remediation**:
  - Add `unarchiveCourse` controller and route `PATCH /:courseId/unarchive` that transitions `course.status` to `"draft"` (or `"published"` if already approved).
  - In `MyCourses.tsx`, add an "Unarchive / Restore" option in the course actions dropdown for archived courses.

---

#### AUDIT-25: Dangling Quiz, Attempt, and Assignment Entities on Course and Lesson Deletions
- **Category**: Orphaned Entities & Foreign Key Corruption
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Student, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L590-L604)
  - [`backend/src/controllers/course/lessonController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/lessonController.ts#L159-L165)
- **Description**:
  When `deleteCourse` is executed in `courseController.ts:590-604`, it initiates cascading deletes across 11 related collections (`LessonProgress`, `LessonItem`, `Comment`, `Note`, `Bookmark`, `Announcement`, `Certificate`, `CourseFAQ`, `Lesson`, `Section`, `Enrollment`, `Review`), but **omits** `Quiz`, `QuizAttempt`, `Assignment`, and `AssignmentSubmission`. Similarly, when a lesson is deleted in `lessonController.ts:deleteLesson:159-165`, it removes `Lesson`, `LessonProgress`, `LessonItem`, and `Comment`, but leaves orphaned `Quiz`, `QuizAttempt`, `Bookmark`, and `Note` records referencing a non-existent lesson, and fails to pull the deleted lesson ID from `Enrollment.completedLessonIds`.
- **Reproduction Steps**:
  1. Instructor creates a course with a Quiz, an Assignment, and bookmarks several lessons.
  2. Instructor deletes the lesson or deletes the entire course.
  3. Inspect MongoDB collections `quizzes`, `quizattempts`, `assignments`, and `assignmentsubmissions`: documents remain with dangling `lesson` and `course` ObjectIds.
  4. Enrolled students who bookmarked the lesson encounter null dereference errors in their Study Hub.
- **Remediation**:
  - In `courseController.ts:deleteCourse`, add `Quiz.deleteMany({ lesson: { $in: lessonIds } })`, `QuizAttempt.deleteMany({ lesson: { $in: lessonIds } })`, `Assignment.deleteMany({ course: course._id })`, and `AssignmentSubmission.deleteMany({ assignment: { $in: assignmentIds } })`.
  - In `lessonController.ts:deleteLesson`, delete associated `Quiz`, `QuizAttempt`, `Bookmark`, and `Note` records, and execute `Enrollment.updateMany({ course: section.course }, { $pull: { completedLessonIds: lesson._id } })`.

---

#### AUDIT-26: Duplicate Order Checkout & Self-Enrollment Corrupts Student Records
- **Category**: Data Integrity & Duplicate Billing
- **Priority**: `P1 — High`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L44-L59, L276-L289)
- **Description**:
  In `orderController.ts:checkout`, the endpoint receives `courseIds` and fetches the matching course records. However, it never checks whether the student is already actively enrolled in any of the requested courses. If a student inadvertently submits checkout with a course they already own (e.g., from multiple open tabs, or clicking "Add to Cart" on the Home page course card), the system charges the student full price, creates a redundant order, and runs `Enrollment.findOneAndUpdate` with `upsert: true`, overwriting the original enrollment timestamps and history.
- **Reproduction Steps**:
  1. Student is actively enrolled in Course A.
  2. Student adds Course A to cart (via Home page or direct API call).
  3. Student checks out.
  4. The order succeeds, charging the student again and resetting their enrollment timestamp.
- **Remediation**:
  - In `orderController.ts:checkout`, query `Enrollment.find({ student: req.user.id, course: { $in: validCourseIds }, status: { $in: ["active", "completed"] } })`.
  - If any course is already enrolled, reject checkout with `400 Bad Request: "You are already enrolled in one or more courses in your cart"`, specifying the offending course titles.

---

#### AUDIT-27: Quiz Completion Gate Desynchronization on Lesson Navigation & Page Reload
- **Category**: State-Synchronization & Assessment Gate Desync
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`frontend/src/components/LessonQuiz.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/LessonQuiz.tsx#L57-L65, L100-L103)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L190-L192, L484)
- **Description**:
  In `LessonViewer.tsx`, `quizPassed` state is initialized to `false` and reset to `false` whenever `lessonId` changes (`useEffect(() => { setQuizPassed(false); }, [lessonId])`). In `LessonQuiz.tsx`, when an existing quiz is fetched on mount (`GET /lessons/:lessonId/quiz`), if `res.data.latestAttempt` indicates `passed: true`, it sets `result` state but never invokes `onQuizPassed?.()`. `onQuizPassed` is only triggered in `handleSubmit` after manually submitting answers. Consequently, if a student passes a quiz, navigates to another lesson or reloads the page, and returns to the quiz lesson, `quizPassed` is `false`. Because line 484 specifies `disabled={!quizPassed && activeLesson.type === 'quiz'}`, the "Mark as Complete" button is permanently disabled, forcing the student to retake and re-submit the entire quiz to proceed.
- **Reproduction Steps**:
  1. Student takes quiz for Lesson X and passes with 100%.
  2. Student navigates to Lesson Y, then navigates back to Lesson X.
  3. Lesson X displays "Assessment Passed" in the quiz card.
  4. The "Mark as Complete" button in the header is disabled (`disabled={!quizPassed}`).
  5. Student is blocked from marking the lesson complete unless they click "Retake Assessment" and re-submit.
- **Remediation**:
  - In `LessonQuiz.tsx:fetchQuiz`, check if `res.data.latestAttempt?.passed` is true; if so, trigger `onQuizPassed?.()`.
  - Alternatively, in `LessonViewer.tsx`, determine quiz completion directly from the lesson progress snapshot or enrollment completed status rather than relying on transient component state.

---

#### AUDIT-28: Quiz Editor Strips Correct Answer for Instructors & Lacks Quiz Removal
- **Category**: Authoring Workflow Inconsistency & Data Loss
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/quizController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/quizController.ts#L86-L90)
  - [`frontend/src/features/instructor/components/QuizEditorModal.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/components/QuizEditorModal.tsx#L32-L40)
- **Description**:
  In `quizController.ts:getQuiz`, the controller unconditionally maps questions to strip `correctAnswer` before sending the response: `const safeQuestions = quiz.questions.map(({ question, options }) => ({ question, options }))`. It does not check if the requesting user is the course owner or an admin. When an instructor opens `QuizEditorModal.tsx` to edit an existing quiz, `res.data.questions` has `correctAnswer: undefined`. The modal cannot pre-select the correct answer radio buttons. If the instructor edits a single typo in question 1 and clicks "Save Quiz", `createOrReplaceQuiz` rejects the payload with `400 Bad Request: "Invalid question format"` because `typeof q.correctAnswer !== "number"`. Furthermore, there is no API endpoint or modal button to delete an unwanted quiz from a lesson.
- **Reproduction Steps**:
  1. Instructor creates a quiz with 3 questions and saves it.
  2. Instructor clicks "Quiz" again on the same lesson in `EditCourse.tsx` to edit question 2.
  3. The modal opens with question texts and options populated, but all "Correct Answer" radio buttons are unselected.
  4. Instructor edits question 2 text and clicks "Save Quiz".
  5. The request fails with `400 Invalid question format` unless the instructor manually re-selects every correct answer radio button.
- **Remediation**:
  - In `quizController.ts:getQuiz`, check `isCourseManager(req.user.id, req.user.role, course.instructor.toString())`. If true, return questions with `correctAnswer` intact.
  - Add a `DELETE /api/lessons/:lessonId/quiz` endpoint and a "Remove Quiz" button in `QuizEditorModal.tsx`.

---

#### AUDIT-29: Deactivated / Banned Instructor Courses Remain Active in Marketplace Catalog
- **Category**: Multi-Role Lifecycle Desync & Catalog Pollution
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L89-L133)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L218-L223)
- **Description**:
  In `adminController.ts:toggleUserStatus`, an administrator can deactivate/ban a malicious or suspended user (`user.isActive = false`). However, the controller performs no cascading updates on the user's published courses. In `courseController.ts:getCourses`, the catalog filter queries `status: "published"` and `isActive: true`, but never verifies whether `instructor.isActive === true`. As a result, suspended or banned instructors' courses remain visible, searchable, and purchasable in the public marketplace, and continue generating cart orders for an inactive user.
- **Reproduction Steps**:
  1. Instructor publishes Course C.
  2. Admin navigates to `/admin/users` and deactivates the instructor's account.
  3. A guest or student visits the marketplace `/courses`.
  4. Course C is still listed as available for purchase and can be checked out.
- **Remediation**:
  - In `adminController.ts:toggleUserStatus`, when deactivating an instructor, automatically unpublish or set `isActive: false` on all courses authored by that instructor.
  - In `courseController.ts:getCourses`, ensure the query populates and filters for active instructors, or adds `{ instructor: { $in: activeInstructorIds } }`.

---

#### AUDIT-30: Notes & Bookmarks Page Runtime Crash on Deleted Lessons
- **Category**: Frontend Runtime Exception & Crash
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`frontend/src/features/student/pages/NotesAndBookmarksPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/NotesAndBookmarksPage.tsx#L120, L151)
- **Description**:
  In `NotesAndBookmarksPage.tsx`, bookmarks are populated via Mongoose. If an instructor deletes a lesson that a student had bookmarked, Mongoose leaves the `Bookmark` document intact but sets `b.lesson` to `null`. On line 120, the search filter attempts: `b.lesson.title.toLowerCase().includes(searchTerm.toLowerCase())`. On line 151, the bookmark remover runs: `setBookmarks((prev) => prev.filter((b) => b.lesson._id !== lessonId))`. Because `b.lesson` is `null`, accessing `.title` or `._id` throws an uncaught `TypeError: Cannot read properties of null (reading 'title')`, crashing the entire page and presenting the student with a blank screen.
- **Reproduction Steps**:
  1. Student bookmarks Lesson 3 in Course D.
  2. Instructor deletes Lesson 3 in Course Studio.
  3. Student navigates to `/notes-and-bookmarks` (Study Hub).
  4. The page immediately crashes with an unhandled runtime error.
- **Remediation**:
  - In `NotesAndBookmarksPage.tsx`, use optional chaining and null checks:
    `b.lesson?.title?.toLowerCase().includes(...)` and `b.lesson?._id !== lessonId`.
  - Filter out orphaned bookmarks whose `b.lesson` is null or undefined when setting state.

---

#### AUDIT-31: Conflicting Instructor Revenue Metrics Between Analytics and Earnings Dashboards
- **Category**: Conflicting Metrics & Financial Reporting Inconsistency
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Instructor
- **Affected Files**:
  - [`backend/src/controllers/instructor/instructorAnalyticsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorAnalyticsController.ts#L79-L83)
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L36-L56)
- **Description**:
  On `/instructor/analytics`, "Total Revenue" is computed by multiplying every enrollment by the course's current price: `const totalEarnings = enrollments.reduce((acc, curr) => acc + (coursePriceMap.get(curr.course.toString()) || 0), 0)`. This completely ignores whether students enrolled for free (e.g., prior to a price change), whether 100% off coupons were applied, and does not deduct the platform's 20% commission. Meanwhile, on `/instructor/earnings`, lifetime earnings are accurately calculated by summing `item.instructorPayout` from completed `Order` records. As a result, an instructor sees two drastically conflicting revenue figures on adjacent pages of the Instructor Studio.
- **Reproduction Steps**:
  1. Instructor creates a free course. 10 students enroll.
  2. Instructor changes course price to $50.
  3. Instructor navigates to `/instructor/analytics`: "Total Revenue" reads `$500.00`.
  4. Instructor navigates to `/instructor/earnings`: "Lifetime Earnings" reads `$0.00`.
- **Remediation**:
  - Update `instructorAnalyticsController.ts` to compute revenue from completed `Order` records (or call the shared earnings calculation utility), aligning the analytics total revenue with the earnings dashboard.

---

#### AUDIT-32: Course Details Page Sidebar Renders Student Purchase Actions for Course Owner
- **Category**: Conflicting UI Indicators & Role Context Leaks
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L750-L850)
- **Description**:
  When an instructor or admin visits their own published course details page (`/courses/:courseId`), the sticky purchase sidebar displays student acquisition actions: "Enroll Now for $XX", "Add to Cart", and "Instant Checkout". There is no recognition that the logged-in user is the course creator. Clicking "Add to Cart" or "Instant Checkout" attempts self-purchase actions.
- **Reproduction Steps**:
  1. Instructor logs into SkillKart.
  2. Instructor views one of their own published courses at `/courses/:courseId`.
  3. The sidebar prompts the instructor to "Add to Cart" or "Enroll Now for $XX".
- **Remediation**:
  - In `CourseDetailsPage.tsx`, compare `course.instructor?._id` with `user.id`.
  - If the user is the course owner or admin, replace the purchase widget with an instructor studio banner: *"You are the instructor of this course"* with an *"Edit in Studio"* button linking to `/instructor/courses/:courseId/edit`.

---

#### AUDIT-33: Unsubmitted Draft Courses Flooding Admin Moderation Queue with Active Disable/Enable Toggles
- **Category**: Conflicting UI Indicators & Multi-Role Lifecycle Desynchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L323-L334)
  - [`frontend/src/features/admin/pages/CourseModeration.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CourseModeration.tsx#L108-L118, L288-L297)
- **Description**:
  In `adminController.ts:getCourses`, the admin endpoint executes a bare `Course.find()` with zero status filtering. Consequently, incomplete, work-in-progress drafts created by instructors (`status: "draft"`, `isApproved: false`) immediately appear in the admin Course Moderation queue (`CourseModeration.tsx`) alongside courses genuinely submitted for review. Furthermore, in `CourseModeration.tsx`, line 288 renders an active "Disable / Enable" toggle switch (`handleToggleActive`) for every course regardless of its lifecycle state. An admin can toggle `isActive` on a private draft course before the instructor has even submitted it for moderation, causing confusing state mutations in the instructor studio where a draft suddenly displays as deactivated by admin.
- **Reproduction Steps**:
  1. Instructor creates a new course in `/instructor/create-course` and saves it as a draft without publishing.
  2. Platform admin navigates to `/admin/courses` (Course Moderation).
  3. The unsubmitted private draft appears in the moderation table.
  4. Admin clicks the "Active" toggle switch on the draft course row; the backend toggles `course.isActive` on an unsubmitted draft.
  5. Instructor visits `/instructor/courses` and finds their draft modified with an unexpected platform state.
- **Remediation**:
  - In `adminController.ts:getCourses`, accept query parameters (e.g., `status`, `isApproved`) and default the moderation queue query to submitted courses (`status: { $in: ["published", "archived"] }` or filter by moderation status) rather than returning private drafts.
  - In `CourseModeration.tsx`, disable or hide the active toggle switch on courses whose `status === 'draft'` or `!isApproved`, and provide a clear status filter tab ("Pending Approval", "Approved", "Drafts", "Rejected").

---

#### AUDIT-34: Course Details Preview Renders Student Enrollment Actions Without Draft/Pending Indicator
- **Category**: Conflicting UI Indicators & Role Context Leaks
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor
- **Affected Files**:
  - [`frontend/src/features/admin/pages/CourseModeration.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CourseModeration.tsx#L215-L222)
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L750-L860)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L338-L346)
- **Description**:
  In `CourseModeration.tsx:215`, the table renders a "Preview" link for each course pointing to `/courses/${course._id}`. In `courseController.ts:getCourseById`, access is allowed if `isCourseManager` or user is admin. However, `CourseDetailsPage.tsx` has zero awareness of moderation or draft preview mode. It renders the full public student acquisition layout: pricing badges, discount countdowns, "Enroll Now", "Add to Cart", and "Instant Checkout". There is no banner or watermark indicating to the administrator or instructor that the page is in "Preview Mode" and that the course is pending approval or in draft. Clicking "Enroll Now" or "Add to Cart" triggers student purchase workflows on an unapproved course.
- **Reproduction Steps**:
  1. Instructor submits a new course for review (`status: "published"`, `isApproved: false`).
  2. Admin navigates to `/admin/courses` and clicks "Preview" on the pending course.
  3. The browser opens `/courses/:courseId`.
  4. The page renders the standard public checkout widget ("Add to Cart", "Instant Checkout") with no visual indicator that the course is in moderation.
- **Remediation**:
  - In `CourseDetailsPage.tsx`, inspect `course.status` and `course.isApproved`. If the viewer is an admin or the course instructor and the course is not live (`status !== 'published'` or `course.isApproved === false`), render a prominent sticky banner: *"Preview Mode — Status: [Pending Moderation / Draft]. This course is not publicly listed."*
  - Replace or augment the purchase sidebar with moderation metadata and a direct action button: *"Back to Moderation"* or *"Approve / Reject"* for admins.

---

#### AUDIT-35: Missing Instructor Payout Cancellation / Withdrawal Transition for Pending Requests
- **Category**: Unhandled Lifecycle Transitions & State Machine Incompleteness
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L328-L412)
  - [`backend/src/routes/instructorRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/instructorRoutes.ts#L45-L55)
  - [`frontend/src/features/instructor/pages/Earnings.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Earnings.tsx#L280-L330)
- **Description**:
  When an instructor requests a withdrawal via `POST /api/instructor/earnings/payouts`, their available balance is deducted immediately and the request is created with `status: "pending"`. If the instructor makes an error in payout details (wrong UPI ID, bank account, or PayPal email), or wishes to cancel the request to combine with future earnings, the system provides no cancellation mechanism. The backend routes in `instructorRoutes.ts` lack any cancel/withdraw endpoint, and `Earnings.tsx` renders a static "Pending" badge with no action. The instructor's funds remain locked in escrow until an admin manually rejects the payout.
- **Reproduction Steps**:
  1. Instructor navigates to `/instructor/earnings` with an available balance of $250.
  2. Instructor submits a payout request for $200 with an incorrect payment handle.
  3. The payout appears in the "Payout History" table with status "Pending", and available balance drops to $50.
  4. Instructor realizes the mistake; there is no "Cancel" or "Withdraw Request" button.
  5. The instructor is powerless to recover their balance without contacting an admin out-of-band.
- **Remediation**:
  - Add endpoint `POST /api/instructor/earnings/payouts/:payoutId/cancel` in `instructorRoutes.ts`.
  - In `instructorEarningsController.ts`, verify the payout belongs to the requesting instructor and has `status === 'pending'`. Transition status to `'cancelled'`, add an audit note, and restore the payout amount to the instructor's available balance.
  - In `Earnings.tsx`, render a "Cancel" action button on pending payout history rows with a confirmation prompt.

---

#### AUDIT-36: Unpublished / Archived Courses Cause Confusing Student Experience Without Notification or Banner
- **Category**: Multi-Role Lifecycle Desynchronization & Student UX
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L504-L561)
  - [`frontend/src/features/student/pages/MyLearning.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/MyLearning.tsx#L85-L135)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L100-L135)
- **Description**:
  When an instructor unpublishes (`unpublishCourse`) or archives (`archiveCourse`) an active course, enrolled students retain active enrollment records (`Enrollment.status === 'active'`). However, the student interfaces in `MyLearning.tsx` and `LessonViewer.tsx` provide no visual indication that the course has been archived or retired. The course card looks identical to active, maintaining courses. Students are not informed why instructor updates, announcements, or Q&A replies have ceased, and if they share or revisit the public course page, they are greeted by an unhandled 404 or access error. Furthermore, neither `unpublishCourse` nor `archiveCourse` dispatches an in-app notification to enrolled learners.
- **Reproduction Steps**:
  1. Student enrolls in Course X.
  2. Instructor unpublishes or archives Course X via `/instructor/courses`.
  3. Student opens `/my-learning`; Course X appears normally with no "Archived" or "Unpublished" indicator.
  4. Student opens `LessonViewer.tsx`; no banner explains that the course is archived or content updates are frozen.
  5. Student receives zero notification regarding the lifecycle status change.
- **Remediation**:
  - In `courseController.ts:unpublishCourse` and `archiveCourse`, dispatch an in-app notification to all actively enrolled students informing them that the course has been unpublished/archived.
  - In `MyLearning.tsx` and `LessonViewer.tsx`, check `course.status` and render an informative badge/banner: *"Archived Course — You have lifetime access to existing content, but new updates and instructor support are concluded."*

---

#### AUDIT-37: User Role Demotion / Update in User Management Desynchronizes Instructor Review Dossier Without Notification
- **Category**: Multi-Role Lifecycle Desynchronization & Administrative UX
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Instructor, Student
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L158-L175)
  - [`frontend/src/features/admin/pages/UserManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/UserManagement.tsx#L79-L106)
  - [`frontend/src/features/admin/pages/InstructorReviews.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/InstructorReviews.tsx#L80-L120)
  - [`backend/src/models/InstructorApplication.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/InstructorApplication.ts)
- **Description**:
  In `/admin/users`, an administrator can update any user's role using the role dropdown (`PATCH /admin/users/:userId/role`). When an instructor is demoted to `student` (or a student is manually upgraded to `instructor`), the handler in `adminController.ts:updateUserRole` only updates `user.role`. It fails to:
  1. Update or synchronize the user's `InstructorApplication` document, causing `InstructorReviews.tsx` to display the user as "Approved" while `UserManagement.tsx` displays them as "Student".
  2. Dispatch an in-app notification or email to the user explaining why their instructor privileges were revoked.
  3. Log an `AuditLog` entry detailing which administrator performed the role transition and the rationale.
- **Reproduction Steps**:
  1. User applies and is approved as an instructor via `/admin/instructor-reviews`.
  2. Platform admin navigates to `/admin/users` and changes the user's role from `instructor` to `student`.
  3. Admin navigates back to `/admin/instructor-reviews`: the user still appears under "Approved" applications.
  4. The demoted user logs in and finds their instructor dashboard inaccessible without any notification explaining why.
- **Remediation**:
  - In `adminController.ts:updateUserRole`, synchronize `InstructorApplication` status (e.g. set status to `rejected` or `revoked` when demoting to student, or `approved` when promoting to instructor).
  - Create an `AuditLog` record logging the administrative role modification.
  - Send an in-app `Notification` to the affected user informing them of the role change.

---

#### AUDIT-38: Wishlist Role Restriction Mismatch & Trapped State on Instructor/Admin Move to Wishlist
- **Category**: Conflicting UI Indicators & Role-Based Access Desynchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Admin, Student
- **Affected Files**:
  - [`frontend/src/features/wishlist/components/WishlistButton.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/wishlist/components/WishlistButton.tsx#L26,L49)
  - [`frontend/src/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/CartPage.tsx#L156-L169)
  - [`frontend/src/App.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/App.tsx#L96-L101)
  - [`backend/src/routes/wishlistRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/wishlistRoutes.ts#L8-L15)
  - [`backend/src/controllers/wishlist/wishlistController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/wishlist/wishlistController.ts#L10-L40)
- **Description**:
  In `WishlistButton.tsx:26,49`, non-student users (instructors and admins) who click the heart button on course cards or course details are blocked by a toast notification stating: `"Only students can maintain a wishlist"`. However, three distinct architectural contradictions exist:
  1. `App.tsx:96-101` wraps `/wishlist` with `allowedRoles={['student', 'instructor', 'admin']}`, explicitly granting instructors and admins access to the Wishlist view.
  2. In `backend/src/routes/wishlistRoutes.ts`, all wishlist endpoints (`GET /api/wishlist`, `POST /api/wishlist/:courseId`, `DELETE /api/wishlist/:courseId`) are protected by `protect` without any role restriction (`authorize('student')` is absent).
  3. In `CartPage.tsx:156-169`, any authenticated user (including instructors and admins purchasing personal courses) can click the "Move to Wishlist" action button on a cart item. The backend accepts the request and saves the course into their `Wishlist` record.
  When an instructor or admin moves a cart item to their wishlist, they can navigate to `/wishlist` to see it, but returning to `/courses` or the course details page renders a disabled heart button with the warning toast. They are completely unable to toggle, favorite, or manage wishlisted items from catalog cards.
- **Reproduction Steps**:
  1. Log in as an instructor or admin.
  2. Add any course to cart and navigate to `/cart`.
  3. Click "Move to Wishlist" on the cart item; the course is removed from cart and added to wishlist successfully.
  4. Navigate to `/courses` or the course details page; observe the heart icon.
  5. Click the heart icon; observe error toast: `"Only students can maintain a wishlist"`.
- **Remediation**:
  - Align platform role policy across frontend and backend: permit instructors and admins to maintain wishlists (lifelong learning is cross-role), or if restricted to students, strictly enforce `authorize('student')` in `wishlistRoutes.ts` and conditionally hide "Move to Wishlist" on `CartPage.tsx` for non-students.
  - Remove the restrictive `user.role !== 'student'` check in `WishlistButton.tsx` so all authenticated learners can toggle wishlist items consistently.

---

#### AUDIT-39: Wishlist Page Lacks Direct "Add to Cart" or Instant Purchase Action
- **Category**: E-Commerce Conversion & Student UX
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Learner
- **Affected Files**:
  - [`frontend/src/features/wishlist/pages/WishlistPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/wishlist/pages/WishlistPage.tsx#L155-L168)
  - [`frontend/src/features/wishlist/components/WishlistCard.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/wishlist/components/WishlistCard.tsx)
- **Description**:
  In `WishlistPage.tsx:155-168`, each saved course card renders only two actions: a link button to `"View Course"` (`/courses/:courseId`) and a `"Remove"` button (`handleRemove(course._id)`). There is no `"Add to Cart"` button or direct checkout action. This forces learners into a cumbersome multi-step navigation loop: Wishlist &rarr; Course Details &rarr; Add to Cart &rarr; Shopping Cart &rarr; Checkout. Users cannot convert multiple saved wishlist items into active purchases without repeatedly navigating away and back.
- **Reproduction Steps**:
  1. Student adds several courses to wishlist.
  2. Student navigates to `/wishlist`.
  3. Student decides to purchase one or more saved courses.
  4. Observe that the only available options are "View Course" or "Remove". There is no button to add the item directly to the shopping cart or initiate purchase.
- **Remediation**:
  - In `WishlistPage.tsx` (and `WishlistCard.tsx`), integrate `useCart` (`addToCart`, `isInCart`).
  - Render an `"Add to Cart"` / `"In Cart"` button alongside `"View Course"`.
  - Optionally provide a `"Move All to Cart"` action at the top of the wishlist page to streamline checkout conversion.

---

#### AUDIT-40: Unenrolled Student Lesson Viewer Access Renders Broken Player and Throws 403 API Errors
- **Category**: Unhandled Lifecycle Transitions & State Synchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Guest
- **Affected Files**:
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L95-L135, L230-L260)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L368-L380)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L170-L185)
- **Description**:
  When an unenrolled authenticated student or guest directly navigates to `/learn/:courseId` (e.g., via bookmark, link share, or browser history), `LessonViewer.tsx` initializes and requests `GET /api/courses/:courseId`. In `courseController.ts:368-380`, `getCourseById` succeeds because the course is published, but the controller omits lesson media/content URLs for unenrolled learners. `LessonViewer.tsx` fails to verify enrollment state (`isEnrolled`), rendering an empty video player with no content, blank lecture navigation, and no purchase call-to-action banner. If the user clicks `"Complete Lesson"`, the backend rejects the request with an unhandled `403 Enrollment is not active`, displaying generic raw toast errors.
- **Reproduction Steps**:
  1. Log in as a student who is NOT enrolled in published Course X.
  2. Manually enter `/learn/:courseX_id` in the browser URL bar.
  3. Observe that the page loads a blank, non-functional lesson viewer without an enrollment prompt or redirect to the course sales page.
  4. Attempting to interact with lesson controls triggers unhandled 403 Forbidden console and toast errors.
- **Remediation**:
  - In `LessonViewer.tsx`, check enrollment state on mount (`useEnrollment(courseId)` or check if user ID exists in enrollment records).
  - If the user is not enrolled, display a friendly paywall / enrollment gate overlay: *"You are not enrolled in this course. Enroll now to access videos, assignments, quizzes, and certificates,"* with a direct link to `/courses/:courseId` or a primary checkout button.
  - In backend `progressController.ts` and `lessonController.ts`, ensure clear client error codes (`NOT_ENROLLED`) with descriptive guidance.

---

#### AUDIT-41: Mid-Course Lesson Additions Demote Completed Enrollments and Orphan Certificates
- **Category**: State Invalidation & Multi-Role Lifecycle Desynchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`backend/src/controllers/course/shared.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/shared.ts#L48-L56)
  - [`backend/src/controllers/course/bulkLessonController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/bulkLessonController.ts#L88-L94)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L224-L232)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L351-L358)
  - [`backend/src/models/Certificate.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Certificate.ts)
- **Description**:
  When an instructor adds new lessons to an existing course (via manual creation in `lessonController.ts` or bulk upload in `bulkLessonController.ts`), `syncEnrollmentLessonCount` increments `totalLessonsCount` across all student `Enrollment` documents for that course. For students who had already completed the course (`status: "completed"`, certificate issued):
  1. Their UI in `MyLearning.tsx` now displays a conflicting state: a green `"Completed"` badge alongside a progress bar showing less than 100% (e.g. 10/12 lessons = 83%).
  2. When the student returns to complete the newly added lesson, `progressController.ts:224-227` evaluates:
     `if (!isFullyComplete && enrollment.status === "completed") { enrollment.status = "active"; enrollment.completedAt = undefined; }`
     This silently demotes the student's enrollment status back to `"active"` and erases `completedAt`.
  3. However, the student's issued `Certificate` document remains untouched in MongoDB. The system enters a corrupt state where a student possesses a valid, publicly verifiable Certificate for an enrollment that the backend considers incomplete and active.
- **Reproduction Steps**:
  1. Student completes all 5 lessons of Course A; enrollment status becomes `"completed"`, certificate is issued.
  2. Instructor uploads 2 new lessons to Course A via bulk CSV upload or lesson builder.
  3. Student opens `/my-learning`; course displays "Completed" but shows 5/7 lessons (71%).
  4. Student opens Course A and completes lesson 6; enrollment status reverts to `"active"`, `completedAt` is wiped.
  5. Student checks `/my-certificates`; the Certificate is still listed and verifiable via `/verify/:certificateId`, directly contradicting the `active` (incomplete) enrollment status in the database.
- **Remediation**:
  - Decide completion semantics for courses with continuous curriculum updates: retain completed status (e.g., grandfathered completion with a visual indicator: *"New content added since completion"*), or introduce an explicit `status: "reopened"` state.
  - Never silently wipe `completedAt` without recording historical completion milestones.
  - Coordinate certificate validity with enrollment status, or mark certificates as tied to a specific curriculum version / date.

---

#### AUDIT-42: Course FAQs Expose Unapproved Course FAQs and Suffer Ordering Index Collisions on Deletions
- **Category**: Content Integrity & Role Isolation Gaps
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/faqController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/faqController.ts#L7-L20, L50-L55)
  - [`frontend/src/features/instructor/components/CourseFAQEditor.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/components/CourseFAQEditor.tsx)
- **Description**:
  In `faqController.ts`:
  1. `getCourseFAQs` performs a bare query `CourseFAQ.find({ course: courseId }).sort({ order: 1 })` without checking if the parent course is published or approved. Unauthenticated public API callers can query FAQs for private drafts, unpublished courses, or courses rejected by admin moderation.
  2. In `createCourseFAQ:50-52`, the default order calculation uses `const count = await CourseFAQ.countDocuments({ course: courseId }); order: count + 1`. If an instructor creates 3 FAQs (orders 1, 2, 3), deletes FAQ 2, and creates a new FAQ, `countDocuments` returns 2, so the new FAQ is assigned `order = 3`. This produces duplicate order indices (`order: 3` on two separate FAQs), resulting in non-deterministic sorting and erratic UI rendering in both the instructor editor and the student accordion view.
- **Reproduction Steps**:
  1. Instructor creates CourseFAQ A (order 1), CourseFAQ B (order 2), CourseFAQ C (order 3).
  2. Instructor deletes CourseFAQ B (2 FAQs remain in DB).
  3. Instructor creates CourseFAQ D; `countDocuments` is 2, so D is assigned order 3.
  4. Both C and D now have `order: 3`.
  5. Reloading the page sorts non-deterministically based on MongoDB document scan order.
- **Remediation**:
  - In `getCourseFAQs`, verify the parent course is published and approved if the request is not from the course owner or admin.
  - In `createCourseFAQ`, calculate next order using the highest existing order: `const maxFaq = await CourseFAQ.findOne({ course: courseId }).sort({ order: -1 }); const nextOrder = (maxFaq?.order || 0) + 1`.
  - Provide an explicit reorder endpoint `PUT /api/courses/:courseId/faqs/reorder` for instructors.

---

#### AUDIT-43: Public Certificate Verification Exposes Broken Navigation Wall and Hardcoded Verification Domain
- **Category**: Public UX & State Desynchronization
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Public Guest, Student, Employer
- **Affected Files**:
  - [`frontend/src/pages/certificates/VerifyCertificatePage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/certificates/VerifyCertificatePage.tsx#L94-L102, L210-L220)
  - [`frontend/src/features/student/pages/MyCertificatesPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/MyCertificatesPage.tsx#L60-L85)
- **Description**:
  The certificate verification route (`/verify/:certificateId` rendered by `VerifyCertificatePage.tsx`) is designed for public verification by employers and external third parties without requiring an account. However:
  1. In `VerifyCertificatePage.tsx:94-102`, the top navigation bar renders an unconditional back button: `<Link to="/my-certificates">← Back to Certificates</Link>`. When an external visitor or employer clicks this button, `App.tsx` intercepts the route with `ProtectedRoute`, forcing the visitor into the authentication login wall.
  2. In line 212, the shareable verification URL hardcodes `skillkart.app/verify` instead of dynamically utilizing `window.location.origin` or configured platform domain settings, generating broken links in staging or local environments.
  3. In `MyCertificatesPage.tsx`, if a completed course has subsequently been deleted by an instructor or admin, `cert.course` populates as `null`. The card crashes or displays broken images because property accesses (`cert.course.thumbnailUrl`, `cert.course.title`) lack null guards.
- **Reproduction Steps**:
  1. Open an incognito / unauthenticated browser session.
  2. Navigate directly to a valid verification link: `/verify/CERT-12345678`.
  3. The certificate verification page renders correctly.
  4. Click the top-left "← Back to Certificates" link.
  5. The visitor is unexpectedly redirected to `/login` with an access prompt.
- **Remediation**:
  - In `VerifyCertificatePage.tsx`, inspect authentication state: render "← Back to Certificates" only if `isAuthenticated` is true; otherwise render "← Back to Courses" linking to `/courses` or homepage `/`.
  - Dynamically construct verification links using `window.location.origin`.
  - In `MyCertificatesPage.tsx`, add defensive null fallbacks when `cert.course` is null/deleted.

---

#### AUDIT-44: Course Generator Force-Regeneration Corrupts Student Progress Records and Quiz Attempts
- **Category**: Data Corruption & State Machine Incompleteness
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Instructor, Student
- **Affected Files**:
  - [`backend/src/services/courseGeneratorService.ts`](file:///c:/Users/user/projects/skillkart/backend/src/services/courseGeneratorService.ts#L1213-L1240)
  - [`backend/src/controllers/admin/adminGeneratorController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminGeneratorController.ts#L35-L60)
- **Description**:
  In `courseGeneratorService.ts:1213-1240`, when the admin regenerates courses from presets with `forceRegenerate: true`, the service wipes all existing structure for the matched course slug:
  `await LessonItem.deleteMany({ lesson: { $in: lessonIds } });`
  `await Quiz.deleteMany({ lesson: { $in: lessonIds } });`
  `await Lesson.deleteMany({ _id: { $in: lessonIds } });`
  `await Section.deleteMany({ _id: { $in: sectionIds } });`
  However, it completely ignores `LessonProgress`, `QuizAttempt`, and `Enrollment.completedLessonIds`. Existing enrolled students are left with progress records and completed lesson ID arrays referencing MongoDB IDs that no longer exist. Their lesson viewer fails to load progress, and completion percentages display invalid metrics.
- **Reproduction Steps**:
  1. Admin generates courses from presets.
  2. Student enrolls in one of the generated courses and completes 3 lessons.
  3. Admin re-runs the generator with `forceRegenerate: true` to update preset descriptions or structure.
  4. Student re-opens `/learn/:courseId`; existing progress records point to deleted lessons, curriculum structure is desynchronized, and completed states do not match new lesson IDs.
- **Remediation**:
  - Check whether active enrollments exist before permitting force-regeneration: if `Enrollment.countDocuments({ course: course._id }) > 0`, disallow hard destruction or archive existing course and generate a new version.
  - If force-regeneration must proceed, cascade deletion to `LessonProgress` and `QuizAttempt`, and reset student `completedLessonIds` with appropriate notifications.

---

#### AUDIT-45: Instructor Announcements Course Selector Lacks Lifecycle Status Indicators
- **Category**: Conflicting UI Indicators & Role Context Leaks
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Instructor
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/Announcements.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Announcements.tsx#L114-L124)
  - [`backend/src/controllers/course/announcementController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/announcementController.ts#L120-L135)
- **Description**:
  In `Announcements.tsx:114-124`, the course selection dropdown renders raw course titles without lifecycle status indicators (`draft`, `pending`, `published`, `archived`). Instructors with multiple draft iterations or archived courses cannot distinguish which course is live. If an instructor mistakenly posts an announcement to a draft or archived course, the announcement is created and stored in the database, but zero students receive notifications (because no active enrollments exist on draft courses). The instructor believes students were alerted when no broadcast occurred.
- **Reproduction Steps**:
  1. Instructor creates Course A (published) and Course A (draft clone or revision).
  2. Instructor navigates to `/instructor/announcements`.
  3. The course dropdown displays two identical or ambiguous entries: `"Course A"` and `"Course A"`.
  4. Instructor selects the draft course and sends an important announcement.
  5. The announcement is posted to a draft course; zero enrolled students exist; no notifications are delivered.
- **Remediation**:
  - In `Announcements.tsx`, enrich the course dropdown options with status pills (e.g. `[Draft]`, `[Live]`, `[Archived]`), and disable selection of draft or archived courses with an explanatory note: *"Announcements can only be broadcast to published courses with enrolled students."*

---

#### AUDIT-46: In-App Notification Deep Links Drop Users onto Video Player Tab with No Tab Context
- **Category**: Notification Deep Linking & Context Loss
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`backend/src/controllers/course/commentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/commentController.ts#L168, L179)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L210, L488)
  - [`backend/src/controllers/course/announcementController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/announcementController.ts#L124)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L102-L108)
- **Description**:
  When backend controllers dispatch notifications for lesson discussion replies, new course announcements, or graded assignment submissions, the notification link points to generic course or lesson paths (e.g., `/learn/:courseId` or `/learn/:courseId/:lessonId`).
  In `LessonViewer.tsx:102`, `const [activeTab, setActiveTab] = useState<'lesson' | 'notes' | 'discussion' | 'announcements' | 'assignments'>('lesson')` hardcodes the active tab to `'lesson'`. The component does not inspect URL query parameters (e.g., `?tab=discussion` or `?tab=announcements`). When a student clicks a notification like *"Instructor replied to your question"*, they are navigated to the course and greeted by the video player, leaving them confused about where the reply is located.
- **Reproduction Steps**:
  1. Student posts a question in lesson discussion.
  2. Instructor replies; student receives notification: *"New reply to your discussion"*.
  3. Student clicks the notification.
  4. The browser navigates to `/learn/:courseId/:lessonId`.
  5. The page displays the Video Player tab (`activeTab === 'lesson'`). The student must manually click the "Discussion" tab to view the response.
- **Remediation**:
  - In `commentController.ts`, append `?tab=discussion` to notification links.
  - In `announcementController.ts`, append `?tab=announcements` to notification links.
  - In `assignmentController.ts`, append `?tab=assignments` to notification links.
  - In `LessonViewer.tsx`, read `useSearchParams()` on mount: if a valid `?tab=` parameter is present, initialize `activeTab` to that tab and auto-scroll to the target item.

---

#### AUDIT-47: Incomplete Cascading on Section Deletions Bypasses Lesson Count Sync and Leaves Dangling Prerequisites
- **Category**: Cascading Deletion Blind Spots & Invariant Corruption
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/course/sectionController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/sectionController.ts#L145-L156)
  - [`backend/src/models/Section.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Section.ts)
  - [`backend/src/models/Enrollment.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Enrollment.ts)
  - [`backend/src/controllers/course/shared.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/shared.ts#L48-L56)
- **Description**:
  In `sectionController.ts:145-156` (`deleteSection`), deleting a course section executes:
  `await LessonProgress.deleteMany({ lesson: { $in: lessonIds } });`
  `await LessonItem.deleteMany({ lesson: { $in: lessonIds } });`
  `await Lesson.deleteMany({ _id: { $in: lessonIds } });`
  `await section.deleteOne();`
  This deletion logic has three severe omissions:
  1. It fails to call `syncEnrollmentLessonCount(section.course.toString())`. Student `Enrollment.totalLessonsCount` remains stale at the old count, preventing students from ever reaching 100% completion.
  2. It does not pull the deleted lesson IDs from existing students' `Enrollment.completedLessonIds`, resulting in invalid completed ID arrays.
  3. It omits cleanup of `Comment`, `Quiz`, `QuizAttempt`, `Note`, and `Bookmark` entities associated with the section's deleted lessons.
  4. If another section in the course had configured `prerequisiteSection` pointing to the deleted section ID, that reference is left dangling, causing prerequisite checks in `getCourseById` to evaluate unpredictably or lock students out of downstream sections.
- **Reproduction Steps**:
  1. Instructor creates Course B with Section 1 (2 lessons) and Section 2 (2 lessons, with Section 1 set as prerequisite).
  2. Student enrolls and completes Section 1 lessons. Total lessons = 4, completed = 2.
  3. Instructor deletes Section 1 from the course builder.
  4. Student opens Course B: Section 2 still references deleted Section 1 as its prerequisite.
  5. Enrollment `totalLessonsCount` still says 4 (instead of 2), while student's completed lessons still reference the deleted IDs.
- **Remediation**:
  - In `sectionController.ts:deleteSection`, invoke `syncEnrollmentLessonCount(courseId)`.
  - Execute `$pull: { completedLessonIds: { $in: lessonIds } }` on all `Enrollment` documents for the course.
  - Delete child `Comment`, `Note`, `Bookmark`, `Quiz`, and `QuizAttempt` documents.
  - Update any sibling sections: `await Section.updateMany({ course: section.course, prerequisiteSection: section._id }, { $unset: { prerequisiteSection: 1 } })`.

---

#### AUDIT-48: Platform Maintenance Mode Lacks Non-Checkout Mutation Route Guards (Data Corruption & State Leak)
- **Category**: State Synchronization & Access Control Discrepancy
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L30)
  - [`backend/src/models/SystemSettings.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/SystemSettings.ts#L80-L95)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L18)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L100)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L30)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L110)
  - [`frontend/src/components/layout/Header.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/layout/Header.tsx#L80-L90,L115-L120)
- **Description**:
  When an administrator toggles **Maintenance Mode** in System Settings (`/admin/settings`), the platform is ostensibly placed in a read-only or maintenance maintenance state. On the frontend, `Header.tsx` renders a red notification banner warning users that *"Platform Maintenance is currently underway"*.
  However, across the entire backend, `SystemSettings.maintenanceMode` is checked **exclusively** within `orderController.ts:30` (checkout). Non-checkout write endpoints—including direct free course enrollment (`enrollmentController.ts`), course creation and updates (`courseController.ts`), lesson progress completion (`progressController.ts`), quiz submissions (`quizController.ts`), assignment submissions and grading (`assignmentController.ts`), and discussion comments (`commentController.ts`)—contain **no maintenance guard**.
  Consequently, users and instructors continue mutating database records under a misleading maintenance banner, risking data inconsistency during maintenance windows, while only payment checkout fails with an abrupt 503 error that appears to users as a payment processor defect rather than a site-wide hold.
- **Reproduction Steps**:
  1. As Admin, navigate to `/admin/settings`, check "Enable Maintenance Mode", set a message, and click Save.
  2. Open an incognito browser window as a student or instructor. Observe the red top bar: *"Platform Maintenance is currently underway."*
  3. Browse to a free course catalog page and click "Enroll Now". The enrollment completes with 200 OK and enrolls the student.
  4. Navigate to `/learn/:courseId` and click "Mark as Complete" on a lesson. Progress is updated in MongoDB.
  5. As an instructor, update a course or grade a student assignment. The mutation succeeds.
  6. Attempt to purchase a paid course in the cart. Checkout crashes with 503 Service Unavailable ("Platform is currently under maintenance").
- **Remediation**:
  - Implement a dedicated Express middleware `ensureNotInMaintenance` in `backend/src/middleware/maintenanceMiddleware.ts`.
  - For any non-GET request (or write routes) initiated by non-admin users (`req.user?.role !== 'admin'`), inspect the singleton `SystemSettings.maintenanceMode`.
  - If enabled, abort the request with `503 Service Unavailable` returning the configured `maintenanceMessage` and `maintenanceEstimatedEndTime`.
  - On the frontend, disable state-modifying action buttons (e.g. Enroll, Submit, Purchase) with a maintenance tooltip when `maintenance.mode` is true.

---

#### AUDIT-49: Disabled User Registration Lacks UI Indicator in Header & Auth Modals (Raw 403 Rejection)
- **Category**: Conflicting UI Indicators & Unhandled Lifecycle Transitions
- **Priority**: `P1 — High`
- **Impacted Roles**: Prospective Student/Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/admin/adminSettingsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminSettingsController.ts#L29)
  - [`backend/src/controllers/auth/authController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/authController.ts#L20-L24)
  - [`backend/src/controllers/auth/googleAuthController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/googleAuthController.ts#L27-L31)
  - [`frontend/src/components/layout/Header.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/layout/Header.tsx#L80-L90,L660-L670)
  - [`frontend/src/features/auth/AuthModals.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/AuthModals.tsx#L98-L108)
- **Description**:
  When an administrator disables **Allow User Registration** in `/admin/settings`, the backend properly enforces the rule: `authController.ts` and `googleAuthController.ts` reject new registrations with `403 Forbidden` (*"New user registration is currently disabled by administrator."*).
  However, the frontend is completely oblivious to this setting. While `/api/settings/public` explicitly returns `allowUserRegistration: false`, `Header.tsx` only extracts `maintenanceMode` and `maintenanceMessage` (line 82), ignoring `allowUserRegistration`.
  As a result:
  1. The top header and mobile navigation continue to render prominent, clickable "Register" and "Sign Up" CTA buttons.
  2. Clicking "Register" launches `AuthModals.tsx` with the "Sign Up" tab selected, prompting the visitor to fill out their full name, email, and password, or authenticate via Google OAuth.
  3. Only upon form submission does the visitor receive a sudden 403 error toast. Google OAuth sign-in fails equally cryptically for first-time users.
- **Reproduction Steps**:
  1. As Admin, navigate to `/admin/settings`, toggle "Allow New User Registration" to OFF, and save changes.
  2. Open an incognito browser window and visit the SkillKart homepage.
  3. Notice the header navbar displays active "Sign Up" and "Register" buttons.
  4. Click "Register", fill in Name, Email, and Password in `AuthModals.tsx`, and click "Create Account".
  5. The modal remains open while a red error toast appears: *"New user registration is currently disabled by administrator."*
- **Remediation**:
  - In `Header.tsx` (and `AuthContext.tsx` or a dedicated system configuration hook), store `allowUserRegistration` from the `/api/settings/public` response.
  - When `allowUserRegistration === false`, hide or disable the "Register" button in the navigation bar.
  - In `AuthModals.tsx`, if `allowUserRegistration === false`, disable switching to the "register" tab, and if opened in register mode, display an informative callout (*"New registrations are temporarily closed. Existing members can sign in below."*) while defaulting the view to the login tab.

---

#### AUDIT-50: Learning Streak Lazy Expiry Gap (Ghost Streaks Displayed Post-Inactivity & Abrupt Drop)
- **Category**: Mismatched Lifecycle States & Misleading Status Badges
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`backend/src/controllers/user/userController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/user/userController.ts#L172-L215)
  - [`backend/src/services/streakService.ts`](file:///c:/Users/user/projects/skillkart/backend/src/services/streakService.ts#L27-L78)
  - [`frontend/src/features/student/components/LearningStreakCard.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/components/LearningStreakCard.tsx#L35-L60)
  - [`frontend/src/pages/Profile.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/Profile.tsx#L102-L130)
- **Description**:
  In SkillKart's learning streak architecture, `User.currentStreak` is only calculated and updated in `streakService.ts:recordUserActivity`, which is triggered when a student completes a lesson (`progressController.ts:saveLessonProgress`).
  When a student views their profile or dashboard, `userController.ts:getStudentStreak` queries `User.findById(userId).select("currentStreak longestStreak lastActiveDate activeDates")` and returns `user.currentStreak` directly from the database document without validating whether the streak is currently active or expired.
  If a student achieves a 14-day streak and stops studying for several weeks or months, their database record retains `currentStreak: 14` indefinitely. When they log in, `LearningStreakCard.tsx` and `Profile.tsx` display *"14 Day Streak! 🔥 Keep the momentum going!"*. The moment the student completes their next lesson to continue their streak, `recordUserActivity` computes `daysDiff > 1` between `user.lastActiveDate` and `todayStr`, resets `newCurrentStreak = 1`, and saves. The student sees their streak suddenly collapse from 14 days to 1 day immediately upon completing study activity, penalizing them for taking action and giving the impression of a software bug.
- **Reproduction Steps**:
  1. Student studies for 3 consecutive days. Stored fields: `currentStreak: 3`, `lastActiveDate: "<3_days_ago>"`.
  2. Student logs into SkillKart today without completing any lessons yet.
  3. Student visits `/profile` or learner dashboard.
  4. The UI displays: *"3 Day Streak! 🔥"*.
  5. Student completes a lesson in `/learn/:courseId`.
  6. The dashboard refreshes: the streak abruptly changes to *"1 Day Streak! 🔥"*.
- **Remediation**:
  - In `backend/src/controllers/user/userController.ts:getStudentStreak`, check streak validity against `todayStr` and `yesterdayStr`:
    If `lastActiveDate` is older than `yesterdayStr` (i.e. `daysDiff > 1`), return `currentStreak: 0` (or lazily update `User.findByIdAndUpdate(userId, { currentStreak: 0 })`).
  - In `streakService.ts`, export a helper `calculateEffectiveStreak(currentStreak, lastActiveDate)` and use it consistently across both API reads and writes.
  - In `LearningStreakCard.tsx`, render an "At Risk / Inactive" badge if `lastActiveDate` was yesterday or older, encouraging the learner to study today to reignite or maintain their streak.

---

#### AUDIT-51: Admin Audit Log Filter Mismatches & Missing Pagination (Phantom Action Filters & Unreachable History)
- **Category**: Phantom Actions & Conflicting UI Indicators
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin
- **Affected Files**:
  - [`frontend/src/features/admin/pages/AuditLogs.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/AuditLogs.tsx#L85-L107,L124-L225)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L698-L717)
  - [`backend/src/controllers/admin/adminSettingsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminSettingsController.ts#L119)
  - [`backend/src/controllers/admin/adminGeneratorController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminGeneratorController.ts#L62)
  - [`backend/src/controllers/category/categoryController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/category/categoryController.ts#L188-L207)
  - [`backend/src/controllers/couponController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/couponController.ts#L140-L160)
- **Description**:
  The Admin Audit Logs interface (`/admin/audit-logs`) suffers from filter desynchronization and pagination omissions:
  1. **Phantom Filters**: In `AuditLogs.tsx:90-94`, the `selectedAction` filter dropdown hardcodes three options: `USER_ACTIVATED`, `USER_DEACTIVATED`, and `COURSE_MODERATED`. However, the backend never records `USER_ACTIVATED` or `USER_DEACTIVATED`—it records `USER_STATUS_TOGGLED` (`adminController.ts:116`). Selecting either option queries `?action=USER_ACTIVATED`, returning an empty list ("No audit logs found") even after modifying numerous user accounts.
  2. **Missing Real Actions**: Valid audit actions generated by the system—`USER_STATUS_TOGGLED`, `USER_ROLE_UPDATED`, `INSTRUCTOR_APPROVED`, `SYSTEM_SETTINGS_UPDATED`, `COURSE_GENERATED`, and `PAYOUT_STATUS_UPDATED`—are completely absent from the frontend filter dropdown.
  3. **Missing Target Type**: The `targetType` filter dropdown offers `user`, `course`, `enrollment`, and `system`, omitting `payout`, making payout moderation logs unfilterable by target.
  4. **Unlogged Critical Mutations**: Key administrative destructive operations—such as category creation/deletion (`categoryController.ts`), coupon creation/deletion (`couponController.ts`), and course deletion (`courseController.ts`)—do not call `recordAuditLog` at all, leaving high-risk administrative actions untracked.
  5. **Unreachable History**: `adminController.ts:getAuditLogs` queries `AuditLog.find(filter).sort({ createdAt: -1 }).limit(100)` with zero pagination support (`page`, `skip`, `totalPages`). Older audit entries beyond the first 100 are permanently inaccessible in the UI.
- **Reproduction Steps**:
  1. Admin navigates to `/admin/users` and toggles a user's active status.
  2. Admin navigates to `/admin/audit-logs`.
  3. In the Action dropdown, select "USER_ACTIVATED" or "USER_DEACTIVATED".
  4. The table displays "No audit logs found".
  5. Clear filters: notice the row exists under the action label `USER_STATUS_TOGGLED`, which cannot be selected from the dropdown.
- **Remediation**:
  - In `AuditLogs.tsx`, update the action dropdown options to match backend action constants: `USER_STATUS_TOGGLED`, `USER_ROLE_UPDATED`, `INSTRUCTOR_APPROVED`, `COURSE_MODERATED`, `COURSE_GENERATED`, `SYSTEM_SETTINGS_UPDATED`, and `PAYOUT_STATUS_UPDATED`.
  - Add `payout` to the `targetType` select options.
  - Instrument `categoryController.ts`, `couponController.ts`, and `courseController.ts` deletion endpoints with `recordAuditLog`.
  - Implement cursor or offset pagination (`page`, `limit`, `totalPages`, `totalCount`) in `getAuditLogs` and add pagination controls to `AuditLogs.tsx`.

---

#### AUDIT-52: Category Deletion Foreign Key Orphanage & Missing Attached Courses Guard
- **Category**: Unhandled Lifecycle Transitions & Data Integrity Discrepancy
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Student, Instructor
- **Affected Files**:
  - [`backend/src/controllers/category/categoryController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/category/categoryController.ts#L188-L207)
  - [`backend/src/models/Course.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Course.ts#L45)
  - [`frontend/src/features/admin/pages/CategoryManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CategoryManagement.tsx#L175-L188)
  - [`frontend/src/features/student/components/CategoryExplorer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/components/CategoryExplorer.tsx#L40-L75)
- **Description**:
  In `categoryController.ts:deleteCategory`, when an admin deletes a category (`DELETE /api/categories/admin/:categoryId`), the controller executes `await Category.findByIdAndDelete(categoryId)` without inspecting whether courses are currently mapped to that category.
  Courses referencing the deleted category continue to store the dangling `course.category` ObjectId.
  Furthermore, on the frontend, `CategoryManagement.tsx` loads each category's live `courseCount` (`cat.courseCount`), but `handleDelete` issues a generic browser prompt (`window.confirm("Are you sure you want to delete...")`) without warning the admin that active courses are assigned to this category.
  When students browse the catalog or filter courses by category, courses with orphaned category IDs either disappear from category-based filtering or cause populated category joins to return `null`, producing blank category chips in course cards.
- **Reproduction Steps**:
  1. Create a course and assign it to the "Web Development" category (`cat.courseCount === 1`).
  2. As Admin, navigate to `/admin/categories`.
  3. Click "Delete" on the "Web Development" row.
  4. The browser alert confirms deletion without mentioning the assigned course. Click OK.
  5. The category is deleted. In the database, the course document still retains `category: ObjectId("...")`.
  6. On the student catalog, filtering by categories leaves the course inaccessible via category taxonomy.
- **Remediation**:
  - In `categoryController.ts:deleteCategory`, check `const attachedCourseCount = await Course.countDocuments({ category: categoryId })`.
  - If `attachedCourseCount > 0`, either:
    1. Reject the deletion with `409 Conflict` (*"Cannot delete category with X attached courses. Reassign or remove courses first."*), OR
    2. Atomically nullify or reassign the foreign keys: `await Course.updateMany({ category: categoryId }, { $unset: { category: 1 } })`.
  - In `CategoryManagement.tsx`, disable the delete button or show a warning modal if `cat.courseCount > 0`, notifying the admin of the affected courses.

---

#### AUDIT-53: Bulk Lesson Upload Delimiter Naivety & Silent Discard of Failed Validation Rows
- **Category**: Conflicting UI Indicators & Unhandled Lifecycle Transitions
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor
- **Affected Files**:
  - [`frontend/src/features/instructor/components/BulkLessonUploadModal.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/components/BulkLessonUploadModal.tsx#L58-L94,L105-L125)
  - [`backend/src/controllers/course/bulkLessonController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/bulkLessonController.ts#L43-L103)
  - [`backend/src/validators/bulkLesson.validator.ts`](file:///c:/Users/user/projects/skillkart/backend/src/validators/bulkLesson.validator.ts#L5-L15)
- **Description**:
  The Bulk Lesson Upload tool (`BulkLessonUploadModal.tsx`) contains two state-synchronization and user-experience issues:
  1. **Naive CSV Splitting**: In `parseCsvText`, lines are parsed using `line.split(",").map(p => p.trim())`. If an instructor uploads a CSV containing lesson titles with commas (e.g. `"Introduction, Architecture & Setup", 15, false`), the comma inside the title splits the string into unexpected columns. The duration is parsed as `NaN` or defaults to 10, the preview boolean is corrupted, and title fragments become separate fields.
  2. **Silent Discard of Failed Rows**: When submitting bulk lessons, `bulkLessonController.ts` validates each row with Zod. If any rows fail validation, it inserts the valid rows and returns `failedRows: [{ row, title, errors }]` along with `failedCount`. However, `BulkLessonUploadModal.tsx:111-115` immediately displays `toast.success(res.data.message)` and invokes `onClose()`. The modal vanishes, and the instructor is never shown which specific rows failed, what validation errors occurred, or which lessons need to be re-entered.
- **Reproduction Steps**:
  1. Instructor opens Bulk Lesson Upload in the curriculum editor.
  2. Switch to CSV mode and paste:
     `"Getting Started, Installation & Config", 20, false`
     `"A", 15, true` (where title is 1 character, failing Zod min(2) requirement)
     `"Deep Dive into Components", 30, false`
  3. Click "Upload Lessons".
  4. The modal immediately closes and displays a success toast.
  5. The curriculum updates with only 1 or 2 lessons. Row 2 failed silently, and Row 1 had its title mangled. The instructor has no visibility into what failed or why.
- **Remediation**:
  - In `BulkLessonUploadModal.tsx:parseCsvText`, implement standard RFC 4180 CSV parsing that respects quoted strings containing commas.
  - In `BulkLessonUploadModal.tsx:handleSubmit`, check `if (res.data.failedCount > 0)`. If any rows fail, keep the modal open, switch to an error review tab, and render the exact failed rows with inline error messages so the instructor can correct them and retry.

---

#### AUDIT-54: Hardcoded Payout Commission Model & Notification Currency Formatting Discrepancies
- **Category**: Misleading Status Badges & Conflicting UI Indicators
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`frontend/src/features/admin/pages/FinancialReports.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/FinancialReports.tsx#L389)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L540-L545,L854)
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L439-L442,L458-L462)
  - [`backend/src/models/SystemSettings.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/SystemSettings.ts#L25-L35)
- **Description**:
  The platform allows administrators to configure dynamic financial settings in `/admin/settings`, including `platformCommissionRate`, `instructorPayoutShare`, and `primaryCurrency` (e.g., `EUR`, `INR`, `GBP`). However, several admin and instructor views contain hardcoded financial assumptions:
  1. In `FinancialReports.tsx:389`, the "Top Earning Instructors" card header hardcodes `<span className="text-[11px] text-slate-400">80% Share Model</span>`, ignoring the actual configured `instructorPayoutShare` (which could be 70%, 85%, or 90%).
  2. In `adminController.ts:541` and `instructorEarningsController.ts:459`, fallback calculations for legacy orders calculate instructor earnings as `Math.round(itemPrice * 0.80 * 100) / 100`, disregarding the singleton `SystemSettings.instructorPayoutShare`.
  3. In `instructorEarningsController.ts:439-441`, the CSV export headers hardcode `"Sale Price ($)"`, `"Platform Fee ($)"`, and `"Instructor Net ($)"` with dollar signs regardless of the platform's primary currency.
  4. In `adminController.ts:854`, payout status update notifications dispatched to instructors hardcode the dollar sign: `message: "Your withdrawal request #${payout.referenceNumber} for $${payout.amount} is now ${status}."`, even when the transaction was in EUR, INR, or GBP.
- **Reproduction Steps**:
  1. In `/admin/settings`, set "Primary Currency" to `EUR` and "Instructor Payout Share" to `75%`. Save changes.
  2. Navigate to `/admin/financial-reports`.
  3. Inspect the "Top Earning Instructors" card header: it still reads "80% Share Model".
  4. Approve an instructor payout request in `/admin/payouts`.
  5. Log in as the instructor: the received notification reads *"for $500.00 is now completed"* instead of *"for €500.00 EUR"*.
- **Remediation**:
  - In `FinancialReports.tsx`, dynamically render the share model percentage from system settings.
  - In `adminController.ts` and `instructorEarningsController.ts`, fetch `SystemSettings` singleton and use `(settings.instructorPayoutShare ?? 80) / 100` for fallback earnings math.
  - Dynamically format payout notification messages using the currency stored on the payout document (`payout.currency || settings.primaryCurrency || 'USD'`).
  - Update CSV export column headers to use dynamic currency notation: `Sale Price (${currency})`.

---

#### AUDIT-55: Lesson Viewer Last-Accessed Redirect Race Condition Overrides Student Resume Point
- **Category**: State Synchronization & Navigation Race Condition
- **Priority**: `P1 — High`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L168-L194)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L156,L244-L290)
- **Description**:
  In `LessonViewer.tsx`, when an enrolled student opens `/learn/:courseId` without an explicit `:lessonId` parameter in the URL:
  1. Lines 168–186 define `fetchProgress`, which asynchronously calls `GET /me/courses/:courseId/progress`. If `!lessonId` and `p.lastLessonId`, it calls `navigate('/learn/' + courseId + '/' + p.lastLessonId, { replace: true })`.
  2. Concurrently, lines 189–193 execute a separate `useEffect`:
     ```typescript
     useEffect(() => {
       if (!lessonId && lessons.length > 0) {
         navigate(`/learn/${courseId}/${lessons[0]._id}`, { replace: true });
       }
     }, [lessonId, lessons, courseId, navigate]);
     ```
  3. Because `fetchCourse` resolves faster than `fetchProgress` (or because `lessons` is populated first), `lessons.length > 0` fires synchronously on the next render cycle before `fetchProgress` resolves. The effect navigates the student to `lessons[0]._id` (Lesson 1).
  4. By the time `fetchProgress` completes, `lessonId` in the component state is no longer empty (`lessonId === lessons[0]._id`), so the check `if (!lessonId && p.lastLessonId)` evaluates to `false` and is completely bypassed.
  5. Furthermore, navigation to Lesson 1 immediately triggers `updateLessonProgress` in the background, updating `enrollment.lastAccessedLessonId` to `lessons[0]._id`. The student's actual resume point in a 50-lesson course is permanently overridden and lost.
- **Reproduction Steps**:
  1. Enroll in a course with 10 lessons.
  2. Navigate through the course up to Lesson 7.
  3. Leave the viewer and return to the main dashboard `/my-learning`.
  4. Click "Continue Learning" on the course card (navigates to `/learn/:courseId` without specifying lesson ID).
  5. Observe network and render timing: the viewer renders Lesson 1 instead of Lesson 7.
  6. Inspect `enrollment.lastAccessedLessonId` in MongoDB: it has been overwritten with Lesson 1's ID.
- **Remediation**:
  - In `LessonViewer.tsx`, introduce a `loadingProgress` state and guard the default redirect: do not execute default redirect to `lessons[0]._id` until `fetchProgress` has concluded.
  - Prioritize `p.lastLessonId` when redirecting from bare `/learn/:courseId`. Only fall back to `lessons[0]._id` if `fetchProgress` returns no `lastLessonId`.

---

#### AUDIT-56: Guest Cart Merging Omits Instructor Self-Course Filter
- **Category**: Multi-Role State Desynchronization & Security/Revenue Loophole
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Guest
- **Affected Files**:
  - [`backend/src/controllers/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cartController.ts#L325-L343)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L80-L100)
- **Description**:
  In AUDIT-21, a direct check was identified in `addToCart` to prevent instructors from purchasing their own courses. However, `cartController.ts:mergeCart` (called immediately after login to merge a guest user's local cart items into their persistent database cart) contains a critical blind spot:
  1. Lines 325–343 fetch valid courses matching `_id: { $in: validCourseIds }`, `status: "published"`, and `isActive: { $ne: false }`.
  2. It checks whether the user is already enrolled (`existingEnrollments`).
  3. However, it **completely omits checking whether `course.instructor.toString() === req.user.id`**.
  4. If an instructor browses the public catalog as a guest or before signing in, adds their own paid course to their local storage cart, and then logs in, `mergeCart` successfully merges the instructor's own course into their user cart.
  5. The instructor's cart page now displays their own course. When they proceed to checkout, unless `orderController.ts:checkout` validates each item against `course.instructor.toString() === req.user.id`, the instructor can execute a checkout on their own course, artificially inflating enrollment statistics and claiming payouts on self-purchases.
- **Reproduction Steps**:
  1. Open an incognito browser window (logged out guest).
  2. Browse to a paid course created by Instructor X.
  3. Click "Add to Cart". The course is saved in guest local storage cart.
  4. Click "Log In" in the header and authenticate as Instructor X.
  5. The frontend invokes `POST /api/cart/merge` with the guest cart items.
  6. Navigate to `/cart`: Instructor X's own course is now present in their active shopping cart.
  7. Proceed to checkout: order completes, self-enrolling the instructor and distorting revenue records.
- **Remediation**:
  - In `cartController.ts:mergeCart`, filter out courses where `course.instructor.toString() === req.user.id`.
  - In `backend/src/controllers/orderController.ts:checkout`, add a hard validation:
    ```typescript
    if (course.instructor.toString() === req.user.id) {
      return res.status(400).json({ message: `You cannot purchase your own course: "${course.title}"` });
    }
    ```

---

#### AUDIT-57: Platform Promo Coupon Live Subsidy Capping Desynchronization
- **Category**: Misleading UI Indicators & Pricing Inconsistencies
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Student, Guest
- **Affected Files**:
  - [`backend/src/controllers/couponController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/couponController.ts#L179-L183)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L117-L121)
  - [`frontend/src/features/cart/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/cart/pages/CartPage.tsx#L85-L115)
  - [`frontend/src/features/admin/pages/AdminCoupons.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/AdminCoupons.tsx#L70-L85)
- **Description**:
  In `couponController.ts:validateCoupon` and `orderController.ts:checkout`, platform-funded coupons (coupons created by admin where `scope === "global"`) are clamped so that the platform's discount cannot exceed the platform's commission rate:
  `const maxPlatformCap = Math.round(subtotal * (liveCommissionRate / 100) * 100) / 100;`
  `discountTotal = Math.min(discountTotal, maxPlatformCap);`
  However:
  1. In `AdminCoupons.tsx`, the admin creation form allows admins to create platform promo codes with discounts up to 99% (e.g. `WELCOME50` with 50% discount). The UI gives no warning that the discount will be capped at the platform commission rate (typically 20%).
  2. When a student applies `WELCOME50` in `CartPage.tsx`, the coupon badge displays "WELCOME50 (50% OFF)", but the actual dollar discount deducted is only 20% of the subtotal.
  3. Neither the backend response nor the cart UI explains why a "50% OFF" coupon deducted only $20 from a $100 cart instead of $50.
  4. The student perceives this as a mathematical error or deceptive advertising, leading to checkout abandonment and support tickets.
- **Reproduction Steps**:
  1. Admin navigates to `/admin/coupons` and creates a global coupon `FLASH50` with 50% discount.
  2. Platform commission rate in `/admin/settings` is set to default 20%.
  3. Student adds a $100 course to cart and applies code `FLASH50`.
  4. The cart banner displays *"Coupon Applied: FLASH50 (50% OFF)"*.
  5. The order summary displays: Subtotal: $100, Discount: -$20, Total: $80.
  6. The 50% discount advertised by the coupon label directly contradicts the 20% discount applied to the total.
- **Remediation**:
  - In `couponController.ts:validateCoupon`, return a metadata flag `isCapped: boolean` and `originalDiscount: number` if clamping occurs.
  - In `CartPage.tsx`, if `isCapped` is true, display an informative note: *"Discount capped at platform maximum subsidy ($20.00)."*
  - In `AdminCoupons.tsx`, add a helper banner or validation warning when creating global coupons: *"Discounts above the platform commission rate ({platformCommissionRate}%) will be automatically capped at checkout unless instructor absorption is enabled."*

---

#### AUDIT-58: Course Reviews Inaccessible for Archived or Unpublished Courses with Active Enrollments
- **Category**: Multi-Role State Desynchronization & Broken Student Views
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`backend/src/controllers/course/reviewController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/reviewController.ts#L48-L54, L148-L154)
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx)
- **Description**:
  In `reviewController.ts:listCourseReviews` (lines 48–54), the controller queries:
  ```typescript
  const courseExists = await Course.exists({ _id: courseId, status: "published" });
  if (!courseExists) {
    return res.status(404).json({ message: "Course not found" });
  }
  ```
  And similarly in `getMyCourseReview` (lines 148–154):
  ```typescript
  const courseExists = await Course.exists({ _id: courseId, status: "published" });
  if (!courseExists) {
    return res.status(404).json({ message: "Course not found" });
  }
  ```
  When an instructor temporarily unpublishes a course for major restructuring or permanently archives it:
  1. Enrolled students retain lifetime access to the course and can still view lessons in `LessonViewer.tsx` (per AUDIT-02).
  2. However, when an enrolled student or instructor views the course's reviews, rating breakdown, or attempts to view their own review, the review endpoint returns `404 Course not found`.
  3. The review tab/section fails to load or crashes with network error toasts.
  4. Enrolled students who completed the course are blocked from viewing peer feedback or modifying their existing review.
- **Reproduction Steps**:
  1. Student enrolls in Course A and leaves a 5-star review.
  2. Instructor unpublishes Course A to `draft` (or archives it) to prepare the next version.
  3. Student navigates to Course A's review section or reviews their student history.
  4. The endpoint `GET /api/courses/:courseId/reviews` returns `404 Not Found`.
  5. The review component displays an unhandled error state.
- **Remediation**:
  - In `reviewController.ts:listCourseReviews` and `getMyCourseReview`, permit review fetching if:
    - The course is `published`, OR
    - The requesting user is an admin, the course instructor, or an enrolled student (`Enrollment.exists({ student: req.user.id, course: courseId })`).

---

#### AUDIT-59: Assignment Graded Notification Omits Deep-Link Tab Parameter
- **Category**: Notification Deep Linking & Context Loss
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L488)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L102)
- **Description**:
  In `assignmentController.ts:gradeSubmission` (line 488), when an instructor grades a student's assignment submission, the backend dispatches a notification:
  ```typescript
  await Notification.create({
    recipient: submission.student,
    title: "Assignment Graded",
    message: `Your submission for "${assignment.title}" has been graded: ${grade}% (${passed ? "Passed" : "Needs Revision"}).`,
    type: passed ? "success" : "warning",
    link: `/learn/${submission.course}`,
  });
  ```
  Notice the `link` is `/learn/${submission.course}` without any query parameters.
  When the student clicks the notification:
  1. `LessonViewer.tsx` initializes with `activeTab = 'lesson'`.
  2. The student is placed in the video lecture player.
  3. There is no visual indication of their graded assignment, rubric score, or instructor feedback comments.
  4. The student must manually deduce that they need to click the "Assignments" tab in the viewer tabs header to see their score and instructor remarks.
- **Reproduction Steps**:
  1. Student submits an assignment for a course.
  2. Instructor reviews and grades the assignment in `/instructor/assignments`, entering feedback and giving a grade of 85%.
  3. Student receives in-app notification: *"Your submission for Project 1 has been graded: 85% (Passed)"*.
  4. Student clicks the notification.
  5. The browser navigates to `/learn/:courseId`.
  6. The default video player renders; the graded assignment details and feedback are hidden under the inactive "Assignments" tab.
- **Remediation**:
  - In `assignmentController.ts:gradeSubmission`, update the link to include tab and assignment deep-link parameters:
    `link: `/learn/${submission.course}?tab=assignments&assignmentId=${submission.assignment}``
  - Ensure `LessonViewer.tsx` activates the `'assignments'` tab when `tab=assignments` is present in the URL query string.

---

#### AUDIT-60: Lesson Item Sequential Order Collision on Deletion & Lack of Reordering Interface
- **Category**: Content Integrity & Invariant Corruption
- **Priority**: `P3 — Low / Polish`
- **Impacted Roles**: Instructor, Student
- **Affected Files**:
  - [`backend/src/controllers/course/lessonItemController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/lessonItemController.ts#L60-L75, L120-L135)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx#L530-L560)
- **Description**:
  Lessons support multiple multimedia items (video streams, downloadable PDFs, external links, text articles) represented by `LessonItem` documents.
  1. In `lessonItemController.ts:createLessonItem` (lines 60–73), the order is calculated as:
     `const order = typeof parsed.data.order === "number" ? parsed.data.order : (lesson.items?.length || 0) + 1;`
  2. In `deleteLessonItem` (lines 120–135), when an item is deleted, the remaining items in the lesson are not re-indexed.
  3. If an instructor adds 3 items (orders 1, 2, 3), deletes item 2, and adds a new item, `(lesson.items?.length || 0) + 1` evaluates to `2 + 1 = 3`. Both the third item and the newly created item now share `order: 3`.
  4. Furthermore, unlike sections (`reorderSections`) and lessons (`reorderLessons`), there is no reordering endpoint or UI drag-and-drop mechanism for lesson items. An instructor who uploads a supplementary PDF after a video cannot move the PDF to appear before the video without deleting and recreating all items.
- **Reproduction Steps**:
  1. Instructor adds Video A (order 1), PDF B (order 2), and Article C (order 3) to a lesson.
  2. Instructor deletes PDF B.
  3. Instructor adds a new Link D.
  4. Link D is assigned order 3 (same as Article C).
  5. The student viewer and instructor studio sort orders become non-deterministic.
  6. Instructor has no UI control to reorder items within a lesson.
- **Remediation**:
  - In `lessonItemController.ts:deleteLessonItem`, re-index remaining items sequentially using `$inc: { order: -1 }` for items with `order > deletedItem.order`.
  - In `createLessonItem`, determine default order using the maximum existing order rather than array length: `const maxItem = await LessonItem.findOne({ lesson: lessonId }).sort({ order: -1 }); const order = (maxItem?.order || 0) + 1`.
  - Introduce `PUT /api/lessons/:lessonId/items/reorder` and add up/down reorder controls in the lesson item list in `EditCourse.tsx`.

---

#### AUDIT-61: Payout Status Machine Lacks Terminal State Guards Permitting Double Payout Disbursals
- **Category**: Financial State Corruption & Security Vulnerability
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L800-L835)
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L376-L384)
  - [`frontend/src/features/admin/pages/AdminPayouts.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/AdminPayouts.tsx#L437-L447)
- **Description**:
  In `instructorEarningsController.ts:requestInstructorPayout`, an instructor's available balance is calculated by subtracting payouts whose status is in `["pending", "processing", "completed"]` from their total net earnings:
  ```typescript
  const existingPayouts = await Payout.find({
    instructor: instructorId,
    status: { $in: ["pending", "processing", "completed"] },
  }).lean();
  const alreadyClaimed = existingPayouts.reduce((acc, p) => acc + p.amount, 0);
  const availableBalance = Math.max(0, Math.round((totalLifetimeNetEarnings - alreadyClaimed) * 100) / 100);
  ```
  If a payout's status is `"rejected"`, it is excluded from `alreadyClaimed`, effectively refunding the amount back to the instructor's available balance.
  However, in `adminController.ts:updatePayoutStatus` (lines 800–835):
  1. The endpoint validates only `if (!["pending", "processing", "completed", "rejected"].includes(status))`.
  2. There is **zero check on previous state transitions**.
  3. If a payout has already reached the terminal state `"completed"` (i.e., funds were already wired to the instructor's bank or PayPal), an admin can open `AdminPayouts.tsx` and accidentally or mistakenly select `"rejected"`.
  4. The backend blindly updates `payout.status = "rejected"`.
  5. The instructor's available balance is immediately credited with that payout amount, allowing the instructor to submit a second withdrawal request for money they already received (double disbursement).
  6. Similarly, the admin UI dropdown in `AdminPayouts.tsx:437-447` unconditionally offers all four status options regardless of whether the payout is already `completed` or `rejected`.
- **Reproduction Steps**:
  1. Instructor has $1,000 net earnings and requests a $1,000 payout.
  2. Available balance drops to $0 ($1,000 claimed).
  3. Admin reviews and marks the payout as "completed" (funds disbursed).
  4. Later, admin opens the payout details modal in `/admin/payouts` and changes status to "rejected" (or mistakenly clicks reject).
  5. The payout status becomes `"rejected"`.
  6. Instructor visits `/instructor/earnings`: available balance now shows $1,000 available again.
  7. Instructor requests another $1,000 payout, resulting in duplicate withdrawal of platform funds.
- **Remediation**:
  - Enforce strict state machine transitions in `adminController.ts:updatePayoutStatus`:
    - `pending` &rarr; `processing` or `rejected`
    - `processing` &rarr; `completed` or `rejected`
    - `completed` &rarr; Terminal (immutable; reject any transition from `completed` with `400 Payout has already been completed and disbursed`).
    - `rejected` &rarr; Terminal (immutable; reject any transition from `rejected`).
  - In `AdminPayouts.tsx`, disable the status update form or restrict selectable options when viewing completed or rejected payouts.

---

#### AUDIT-62: Cancelled Enrollment Cart Lockout (Permanent Repurchase Block)
- **Category**: Unhandled Lifecycle Transitions & State Synchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Guest
- **Affected Files**:
  - [`backend/src/controllers/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cartController.ts#L146-L154,L328-L336)
  - [`frontend/src/features/enrollment/hooks/useEnrollment.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/features/enrollment/hooks/useEnrollment.ts#L102)
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L182-L210)
- **Description**:
  When a student cancels an enrollment or unenrolls from a course (`DELETE /api/enrollments/:id`), `enrollmentController.ts:cancelEnrollment` updates the enrollment record to `status: "cancelled"`.
  On the client side, `useEnrollment.ts:102` correctly assesses active enrollment as `isEnrolled = status === 'active' || status === 'completed'`, which evaluates to `false`. Consequently, [`CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx) hides the "Go to Course" CTA and presents the learner with "Add to Cart" or "Buy Now".
  However, in `cartController.ts:addToCart` (lines 146–154), the backend checks:
  ```typescript
  const isEnrolled = await Enrollment.exists({
    student: req.user.id,
    course: course._id,
  });
  if (isEnrolled) {
    return res.status(400).json({ message: "You are already enrolled in this course." });
  }
  ```
  Because this check **does not filter by `status: { $in: ["active", "completed"] }`**, the existence of ANY historical enrollment record—even one cancelled months ago or expired—triggers an immediate `400 Bad Request`. The learner receives a toast error *"You are already enrolled in this course."* while looking at a purchase button, and is permanently blocked from adding the course to their cart or purchasing it again.
  Furthermore, `cartController.ts:mergeCart` (lines 328–336) queries `Enrollment.find({ student: req.user.id, course: { $in: validCourseIds } })` with the same unconstrained filter, silently dropping courses from guest shopping carts upon user login if the user previously had a cancelled enrollment.
- **Reproduction Steps**:
  1. Student enrolls in Course A (paid or free).
  2. Student navigates to `/my-courses` and clicks "Unenroll" (status becomes `"cancelled"`).
  3. Student navigates back to `/courses/:courseId` for Course A.
  4. The page displays the purchase card with the "Add to Cart" button (since `isEnrolled` is false).
  5. Student clicks "Add to Cart".
  6. Backend rejects with `400 Bad Request: "You are already enrolled in this course."`.
  7. The course cannot be added to the cart, cannot be checked out, and the learner is permanently locked out from re-enrolling.
- **Remediation**:
  - In `cartController.ts:addToCart`, constrain the enrollment check to active/completed records:
    ```typescript
    const isEnrolled = await Enrollment.exists({
      student: req.user.id,
      course: course._id,
      status: { $in: ["active", "completed"] },
    });
    ```
  - In `cartController.ts:mergeCart`, constrain the query to exclude cancelled or expired enrollments:
    ```typescript
    const existingEnrollments = await Enrollment.find({
      student: req.user.id,
      course: { $in: validCourseIds },
      status: { $in: ["active", "completed"] },
    }).select("course").lean();
    ```
  - In `orderController.ts:checkout`, ensure that auto-enrollment for repurchased courses (`Enrollment.findOneAndUpdate`) resets `completedLessonIds: []`, `progressPercentage: 0`, `status: "active"`, and clears `completedAt: undefined` if a previous cancelled enrollment document is being revived.

---

#### AUDIT-63: Progress Mutation Route Split & Mandatory Quiz Gate Bypass
- **Category**: State Synchronization & Security Gate Bypass
- **Priority**: `P1 — High`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L246-L363)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L100-L167)
  - [`frontend/src/features/enrollment/services/enrollmentService.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/features/enrollment/services/enrollmentService.ts#L13-L14)
- **Description**:
  The platform maintains two parallel, competing API routes for marking lesson progress, which have completely diverged in business logic and validation:
  1. `POST /api/lessons/:lessonId/progress` (`progressController.ts:updateLessonProgress`):
     - Validates quiz gating (`if (lesson.hasQuiz && completed) ... QuizAttempt.findOne({ lesson: lessonId, passed: true })`).
     - Updates the granular `LessonProgress` collection.
     - Calls `recordUserActivity` to track daily learning streaks.
     - Dynamically calculates course completion and issues certificates.
  2. `PATCH /api/enrollments/:id/progress` (`enrollmentController.ts:updateProgress`):
     - Completely **bypasses the quiz completion gate**, allowing any client or script calling this route to mark a lesson completed without passing the required quiz.
     - Fails to call `recordUserActivity`, completely breaking streak increments.
     - Contains an unhandled terminal state lock (line 263):
       ```typescript
       if (enrollment.status === "completed") {
         return res.status(403).json({ message: "Course already completed" });
       }
       ```
       Because of this 403 lock, the un-complete and progress reduction logic located further down in the method (lines 351–356):
       ```typescript
       if (progressPercentage < 100 && enrollment.status === "completed") {
         enrollment.status = "active";
         enrollment.completedAt = undefined;
       }
       ```
       is **completely unreachable dead code**. If a student has completed a course, calling `PATCH /enrollments/:id/progress` with `{ isCompleted: false }` returns a 403 error instead of allowing them to uncomplete the lesson.
     - Most critically, `enrollmentController.ts` mutates `Enrollment.completedLessonIds` directly without updating the `LessonProgress` collection, leading to persistent data desynchronization between the two collections.
- **Reproduction Steps**:
  1. Instructor creates a lesson with a mandatory quiz gate (`hasQuiz = true`).
  2. Student enrolls in the course without taking the quiz.
  3. Student (or automated client using `enrollmentService.ts:updateProgress`) issues `PATCH /api/enrollments/:enrollmentId/progress` with `{ lessonId, isCompleted: true }`.
  4. Backend accepts the request with `200 OK`, pushes the lesson ID into `completedLessonIds`, and increments progress percentage, completely bypassing the mandatory quiz requirement.
  5. Student inspects their learning streak; the streak count did not increment because `recordUserActivity` was omitted.
  6. Once all lessons are marked completed, student sends `{ lessonId, isCompleted: false }` to reset a lesson.
  7. Endpoint rejects with `403 Forbidden: "Course already completed"`, trapping the student.
- **Remediation**:
  - Deprecate or unify `PATCH /api/enrollments/:id/progress` into `progressController.ts:updateLessonProgress`, or refactor `enrollmentController.ts:updateProgress` to delegate directly to the progress service.
  - Enforce the mandatory quiz gate check (`QuizAttempt.findOne({ lesson: lessonId, passed: true })`) in both routes.
  - Call `recordUserActivity` whenever a lesson is marked completed.
  - Remove the unconditional 403 guard on `enrollment.status === "completed"` if `isCompleted === false`, allowing the un-complete logic on lines 351–356 to execute.
  - Synchronize both `Enrollment.completedLessonIds` and `LessonProgress` records on every progress mutation.

---

#### AUDIT-64: Unenrollment Lifecycle Incompleteness (Ghost Certificates & Progress Desynchronization on Re-enrollment)
- **Category**: Unhandled Lifecycle Transitions & Multi-Model Inconsistency
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Public / Verifiers
- **Affected Files**:
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L48-L60,L160-L165,L365-L380)
  - [`backend/src/controllers/certificate/certificateController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/certificate/certificateController.ts#L30-L54)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L244-L294)
  - [`frontend/src/features/student/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/MyCourses.tsx#L63-L65,L88-L105)
- **Description**:
  When a student cancels an enrollment via `DELETE /api/enrollments/:id`:
  1. `enrollmentController.ts:cancelEnrollment` (lines 365–380) sets `enrollment.status = "cancelled"`.
  2. However, **all `LessonProgress` documents belonging to the student for that course remain intact and marked `completed: true`**, and any issued `Certificate` remains active and verified in the database.
  3. The public certificate verification endpoint `GET /api/certificates/verify/:certificateId` validates that the certificate exists and has `revoked: false`, but does not verify if the student is actively enrolled. An un-enrolled learner's certificate remains publicly verifiable.
  4. Furthermore, when the student re-enrolls in the course via `enrollInCourse` (lines 48–60), the backend executes:
     ```typescript
     existing.status = "active";
     existing.enrolledAt = new Date();
     existing.completedLessonIds = [];
     existing.progressPercentage = 0;
     existing.completedAt = undefined;
     await existing.save();
     ```
     `Enrollment.completedLessonIds` is wiped clean to `[]`, but the `LessonProgress` collection is NOT updated.
  5. When the student opens the course in `LessonViewer.tsx`, the viewer fetches progress via `GET /api/courses/:courseId/progress` (`progressController.ts:getMyCourseProgress`), which queries the `LessonProgress` collection. All lessons are returned with `completed: true` (100% green checkmarks), while the student dashboard (`EnrollmentCard.tsx`) queries the enrollment record showing `progressPercentage = 0%`.
  6. Additionally, in `enrollmentController.ts:getMyEnrollments` (lines 160–165):
     ```typescript
     const filter: Record<string, unknown> = { student: req.user.id };
     if (status) filter.status = status;
     ```
     When `MyCourses.tsx` fetches `/enrollments/me` without a `?status=` parameter, cancelled enrollments are included in the array. In `MyCourses.tsx` (lines 88–105), because `enrollments.length > 0`, the empty state illustration *"Start your learning journey"* is bypassed. But because `activeCourses` and `completedCourses` filter out `"cancelled"` enrollments, both sections render empty, leaving the student with a confusing blank white screen and no courses or CTA.
- **Reproduction Steps**:
  1. Student completes a course to 100% and receives a completion certificate.
  2. Student cancels enrollment via `DELETE /api/enrollments/:id`.
  3. Open public verify URL `/certificates/verify/:certificateId`; certificate reports valid and authentic despite cancelled enrollment.
  4. Visit `/my-courses`; `enrollments` contains 1 cancelled item. The page displays neither an empty state nor any course cards (blank screen).
  5. Re-enroll in the course; `Enrollment.progressPercentage` resets to 0%.
  6. Open `/learn/:courseId`; `LessonViewer` queries `LessonProgress` and marks all lessons complete (100% checkmarks) while dashboard shows 0%, causing complete UI desynchronization.
- **Remediation**:
  - In `cancelEnrollment`:
    - Either delete or reset `LessonProgress` records for that student and course (`LessonProgress.deleteMany({ user: studentId, lesson: { $in: courseLessonIds } })`).
    - Revoke or flag issued certificates as revoked upon enrollment cancellation (`Certificate.updateMany({ student: studentId, course: courseId }, { $set: { isRevoked: true, revocationReason: "Enrollment cancelled" } })`).
  - In `getMyEnrollments`, default the filter to active and completed courses unless explicitly requested:
    ```typescript
    const filter: Record<string, unknown> = {
      student: req.user.id,
      status: status || { $in: ["active", "completed"] },
    };
    ```
  - In `MyCourses.tsx`, compute the empty state condition against `activeCourses.length === 0 && completedCourses.length === 0` rather than `enrollments.length === 0`.

---

#### AUDIT-65: Lesson Discussion Indiscriminate Instructor Badge Masking Peer Learners as Course Instructors
- **Category**: Conflicting UI Indicators & Multi-Role Identity Confusion
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`frontend/src/features/student/components/LessonDiscussion.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/components/LessonDiscussion.tsx#L212-L216,L337-L341)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L446-L450)
- **Description**:
  In `LessonDiscussion.tsx` (lines 212–216 and 337–341), the discussion thread displays badges next to commenters' names:
  ```tsx
  {comment.user?.role === 'instructor' && (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
      Instructor
    </span>
  )}
  ```
  This badge is rendered whenever `comment.user?.role === 'instructor'`, regardless of who authored the course.
  In a multi-role LMS where instructors frequently enroll as students in peer courses (e.g. an instructor teaching Graphic Design enrolling in a Python course), any comment or question posted by that instructor peer is decorated with an official blue "Instructor" badge.
  Students in the course misinterpret these comments as official guidance from the course instructor.
  Meanwhile, `LessonDiscussion` already receives `courseInstructorId` as a prop from `LessonViewer.tsx`, but only uses it inside `canDeleteComment`. It fails to distinguish between the actual Course Author/Teacher (`comment.user._id === courseInstructorId`) and an enrolled peer learner who happens to hold the instructor role on the platform.
- **Reproduction Steps**:
  1. Instructor A creates and publishes "Advanced Python".
  2. Instructor B (an English instructor) enrolls in "Advanced Python" as a learner.
  3. Instructor B posts a question in lesson 1: *"I don't understand how list comprehensions work here."*
  4. Student C opens the lesson discussion.
  5. Student C sees Instructor B's question marked with an official blue "Instructor" badge, believing Instructor B is the course teacher admitting confusion or posting authoritative answers.
- **Remediation**:
  - In `LessonDiscussion.tsx`, differentiate badges using `courseInstructorId`:
    - If `comment.user?._id === courseInstructorId`, render an authoritative badge: `"Course Instructor"` or `"Author"` with an instructor star icon.
    - If `comment.user?.role === 'instructor'` and `comment.user?._id !== courseInstructorId`, omit the instructor badge entirely or render a subtle `"Instructor (Student)"` / `"Peer"` badge.
  - Apply the identical distinction to nested replies on lines 337–341.

---

#### AUDIT-66: Lesson Viewer Redundant "Update" Button & Inability to Reset / Un-mark Completed Lessons
- **Category**: Conflicting UI Indicators & Broken Action Affordances
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L209-L229,L489-L512)
- **Description**:
  In `LessonViewer.tsx`, when the current lesson is not yet completed, the bottom-right action button displays `"Mark as Complete"`.
  However, once a lesson is marked completed (`isCompleted === true`), lines 489–512 replace the button with:
  ```tsx
  <button
    onClick={() => handleProgress(false)}
    className="... bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 ..."
    title="Mark again to refresh progress"
  >
    <CheckCircleIcon className="w-4 h-4" />
    <span>Update</span>
  </button>
  ```
  This implementation creates multiple conflicting and confusing UX behaviors:
  1. The tooltip *"Mark again to refresh progress"* and label *"Update"* convey that clicking the button will update some state. However, `handleProgress(false)` unconditionally sends `{ completed: true }` to the backend. It does not refresh anything; it simply re-sends a redundant completed status.
  2. Students who wish to **un-mark or reset a completed lesson** (e.g. to review it again from scratch, or because it was marked completed inadvertently) have no UI mechanism to toggle completion off, even though the backend supports progress recalculation.
  3. On the final lesson of a course, clicking the emerald "Update" button invokes `onCourseComplete()`, triggering the confetti animation and course completion modal repeatedly on every click, trapping the learner in a redundant modal loop.
- **Reproduction Steps**:
  1. Student opens any lesson and clicks "Mark as Complete".
  2. The button transforms into an emerald button labelled "Update" with a checkmark icon.
  3. Hovering over the button displays the tooltip "Mark again to refresh progress".
  4. Student clicks "Update": a network call is dispatched sending `{ completed: true }` again, and the player advances to the next lesson or re-opens the course completion modal.
  5. Student has no option or toggle to unmark the lesson as incomplete.
- **Remediation**:
  - Convert the completion action into a clear toggle button or status pill:
    - When completed: render a green pill `"Completed"` with a secondary action `"Mark Incomplete"` or `"Reset Progress"`, allowing students to explicitly toggle completion off via `{ completed: false }`.
    - Alternatively, if re-completion is not supported, replace the "Update" button with `"Next Lesson"` or a disabled status badge `"Completed"` to avoid phantom clicks.
  - Guard the final lesson completion modal trigger so it only fires on initial completion, not on subsequent reviews or repeat clicks of the final lesson.

---

#### AUDIT-67: Free Preview Lesson Architectural Disconnect (Stripped Media, Missing Authoring Toggle, & Viewer Crash)
- **Category**: Lifecycle Gating & Content Accessibility Disconnect
- **Priority**: `P1 — High`
- **Impacted Roles**: Prospective Student / Guest Learner, Course Author (Instructor), Admin
- **Affected Files**:
  - [`backend/src/models/Lesson.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Lesson.ts#L22-L28)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L370-L373)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx#L410-L460)
  - [`frontend/src/components/course/CourseStructure.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/course/CourseStructure.tsx#L12-L35,L95-L125)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L110-L128)
- **Description**:
  The LMS architecture establishes support for sample introductory lessons via `Lesson.isPreview: { type: Boolean, default: false }`. This flag is utilized by `courseGeneratorService.ts` and `BulkLessonUploadModal.tsx` to designate free sample lectures intended to convince prospective learners to enroll.
  However, the feature is completely broken end-to-end across authoring, API delivery, catalog browsing, and playback:
  1. In `EditCourse.tsx`, the lesson creation and modification modals omit any checkbox, toggle, or input for `isPreview`. Instructors authoring courses in the web studio have no mechanism to mark an introductory video as a free sample.
  2. In `courseController.ts:370-373` (`getCourseById`), the controller executes:
     `const lessonItems = (lessonIds.length && isEnrolledOrManager) ? await LessonItem.find({ lesson: { $in: lessonIds } }).sort({ order: 1 }).lean() : [];`
     When an unauthenticated guest or unenrolled student queries course details, `isEnrolledOrManager` evaluates to `false`. The controller wipes all `lessonItems` to an empty array `[]`—even for lessons explicitly flagged with `isPreview: true`. The frontend catalog thus never receives the video URLs or media items needed to stream preview lectures.
  3. In `CourseStructure.tsx`, the curriculum accordion renders all lessons uniformly with standard play icons, providing no visual indication (e.g. `"Free Preview"` pill) and no interactive action button to launch preview playback.
  4. If an unenrolled visitor attempts to navigate directly to `/learn/:courseId/:lessonId` for a preview lecture, `LessonViewer.tsx` initializes enrollment state, throws 403 API errors on bookmarks/notes/progress, and renders a broken or blocked player experience.
- **Reproduction Steps**:
  1. Seed or bulk upload a course where the first lecture is marked `isPreview: true`.
  2. Log in as the course instructor and navigate to `/instructor/courses/:courseId/edit`.
  3. Expand the section and edit the lesson: notice there is no toggle or indicator for Free Preview.
  4. Open an incognito browser window and view `/courses/:courseId`.
  5. Expand the curriculum accordion in `CourseStructure.tsx`: observe all lectures look identical with no "Preview" tag or preview player modal.
  6. Inspect network responses for `GET /api/courses/:courseId`: notice `lessonItems` is `[]`.
  7. Navigate to `/learn/:courseId/:lessonId`: the player fails to load media items and throws 403 Forbidden errors.
- **Remediation**:
  - In `EditCourse.tsx`, add an `isPreview` ("Allow Free Sample Preview") toggle in the lesson modal.
  - In `courseController.ts:getCourseById`, update `lessonItems` retrieval so that preview items are preserved for non-enrolled viewers:
    ```typescript
    const previewLessons = lessons.filter((l) => l.isPreview).map((l) => l._id);
    const lessonItemFilter = isEnrolledOrManager
      ? { lesson: { $in: lessonIds } }
      : { lesson: { $in: previewLessons } };
    const lessonItems = lessonIds.length
      ? await LessonItem.find(lessonItemFilter).sort({ order: 1 }).lean()
      : [];
    ```
  - In `CourseStructure.tsx`, accept `isPreview?: boolean` on lecture items. For preview lectures, render a blue `"Preview"` pill and a button that opens a lightweight video preview modal.

---

#### AUDIT-68: Assignment Due Date Enforcement Void & Missing Late Submission Flagging
- **Category**: State Tracking & Grading Lifecycle Void
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`backend/src/models/AssignmentSubmission.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/AssignmentSubmission.ts#L10-L28)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L316-L366)
  - [`frontend/src/features/student/components/CourseAssignmentsTab.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/components/CourseAssignmentsTab.tsx#L210-L235)
  - [`frontend/src/features/instructor/pages/Assignments.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Assignments.tsx#L500-L580)
- **Description**:
  When instructors create course assignments, they can specify an optional `dueDate: Date` to establish submission deadlines.
  However, the platform never validates or enforces this deadline at submission time:
  1. In `assignmentController.ts:submitAssignment`, the handler validates student enrollment and assignment existence, but never compares `new Date()` against `assignment.dueDate`.
  2. The `AssignmentSubmission` model lacks an `isLate: boolean` attribute or late submission timestamp differential.
  3. In `CourseAssignmentsTab.tsx`, if the current date is past `dueDate`, the "Submit Work" button remains active without any warning indicating that the assignment is overdue or that the submission will be marked late.
  4. In `Assignments.tsx` (Instructor Gradebook), submissions handed in weeks after the deadline appear indistinguishable from on-time submissions. Instructors have no indicator or badge to enforce late penalties or identify delinquent student work.
- **Reproduction Steps**:
  1. Instructor creates an assignment with a `dueDate` set in the past (e.g. yesterday).
  2. Enrolled student navigates to `/learn/:courseId?tab=assignments`.
  3. The card shows "Due: Yesterday", but the "Submit Work" action button is fully enabled with no late warning.
  4. Student submits files and text. The server returns 201 Created.
  5. Instructor views the Gradebook: the submission shows "Submitted" with no "Late" badge or indicator, misleading the instructor into believing it met the deadline.
- **Remediation**:
  - In `AssignmentSubmission.ts`, add `isLate: { type: Boolean, default: false }`.
  - In `assignmentController.ts:submitAssignment`, if `assignment.dueDate` is present and `new Date() > new Date(assignment.dueDate)`, set `submission.isLate = true`.
  - In `CourseAssignmentsTab.tsx`, display an amber callout if past due (*"This assignment is past its due date. Submissions will be marked as Late."*).
  - In `Assignments.tsx` Gradebook and student submission history, display an amber/red `"Late"` pill next to late submissions.

---

#### AUDIT-69: Resubmission Request Notification Misclassification & Misleading "Success" Alert
- **Category**: Notification State Machine & Communication Ambiguity
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L479-L493)
  - [`frontend/src/components/common/NotificationBell.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/NotificationBell.tsx#L110-L135)
- **Description**:
  When grading an assignment submission in `/instructor/assignments`, instructors can choose between two completion statuses: `"graded"` or `"resubmission_requested"`. A resubmission request is selected when a student's work is incomplete, broken, or needs substantial revision before a passing grade can be awarded.
  However, in `assignmentController.ts:484-490`, the notification payload is hardcoded regardless of status:
  ```typescript
  await Notification.create({
    recipient: submission.student,
    title: "Assignment Graded",
    message: `Your submission for "${assignment.title}" was graded: ${submission.score}/${assignment.maxScore} points.`,
    type: "success",
    link: `/learn/${courseId}?tab=assignments`,
  });
  ```
  When an instructor requests revisions (often with `score: 0`), the student receives an in-app notification labelled `"Assignment Graded"` categorized as `"success"`, displaying `was graded: 0/100 points`.
  This confuses learners into believing either that their assignment was successfully approved with a zero, or that the grading was final and no resubmission action is expected.
- **Reproduction Steps**:
  1. Student submits an assignment for review.
  2. Instructor reviews work, selects status `"Request Resubmission"`, leaves notes explaining required changes, and saves.
  3. Student opens Notification Bell in the header.
  4. A bright green checkmark notification appears: *"Assignment Graded: Your submission for Final Project was graded: 0/100 points."*
  5. The notification fails to indicate that resubmission is requested.
- **Remediation**:
  - In `assignmentController.ts:gradeSubmission`, branch the notification message and type based on `submission.status`:
    ```typescript
    const isResubmit = submission.status === "resubmission_requested";
    await Notification.create({
      recipient: submission.student,
      title: isResubmit ? "Assignment Revision Requested" : "Assignment Graded",
      message: isResubmit
        ? `Your instructor requested revisions on "${assignment.title}". Please check feedback and resubmit.`
        : `Your submission for "${assignment.title}" was graded: ${submission.score}/${assignment.maxScore} points.`,
      type: isResubmit ? "warning" : "success",
      link: `/learn/${courseId}?tab=assignments`,
    });
    ```

---

#### AUDIT-70: Multi-Role Assignment Rubric Criterion Score Boundary Desync
- **Category**: Input Validation & Scoring Integrity Void
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Student, Admin
- **Affected Files**:
  - [`backend/src/validators/assignmentValidator.ts`](file:///c:/Users/user/projects/skillkart/backend/src/validators/assignmentValidator.ts#L47-L57)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L441-L477)
  - [`frontend/src/features/instructor/pages/Assignments.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Assignments.tsx#L840-L865)
- **Description**:
  Assignments support structured grading rubrics where instructors define specific criteria (e.g. "Architecture & Clean Code: 25 pts", "Test Coverage: 25 pts", "Documentation: 10 pts").
  When grading submissions in `Assignments.tsx`:
  1. In `assignmentValidator.ts:gradeSubmissionSchema`, each rubric item score is validated only with `pointsEarned: z.number().min(0)`. There is no upper bound validation against the criterion's `maxPoints`.
  2. In `assignmentController.ts:gradeSubmission`, the backend validates that `score <= assignment.maxScore`, but completely fails to check that each `pointsEarned` in `rubricScores` does not exceed that criterion's `maxPoints`, nor does it verify that the rubric scores sum up to the total score.
  3. In `Assignments.tsx:848-855`, the input field renders:
     `<input type="number" min={0} value={...} />`
     It omits the `max={criterion.maxPoints}` HTML constraint.
  An instructor can enter 200 points for a 20-point rubric item. The server persists the corrupted rubric score, distorting rubric progress bars and student evaluation breakdowns.
- **Reproduction Steps**:
  1. Instructor creates an assignment with rubric criterion "Unit Testing (Max: 20 pts)".
  2. Student submits project.
  3. Instructor opens grading modal, enters `95` in the Unit Testing points input, and saves.
  4. Backend accepts the value with 200 OK.
  5. Student views grading rubric breakdown: the progress bar renders 475% width or overflows layout bounds with 95/20 points earned.
- **Remediation**:
  - In `Assignments.tsx`, bind `max={criterion.maxPoints}` on each rubric criterion input.
  - In `assignmentController.ts:gradeSubmission`, load the assignment rubric criteria and validate:
    - For each item in `rubricScores`, verify `criterionId` exists in `assignment.rubric`.
    - Verify `pointsEarned <= matchingCriterion.maxPoints`.
    - Optionally assert that `score` equals the sum of `pointsEarned` across all rubric criteria when rubric grading is used.

---

#### [x] AUDIT-71: Onboarding Role Selection Bypasses Instructor Moderation Workflow & Auto-Approval Policy
- **Category**: Security / Moderation Bypass & Role State Desynchronization
- **Priority**: `P0 — Critical / Blocker`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/auth/onboardingController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/onboardingController.ts)
  - [`frontend/src/pages/OnboardingPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/OnboardingPage.tsx)
  - [`frontend/src/features/auth/auth.api.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/auth.api.ts)
  - [`frontend/src/features/auth/auth.service.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/auth.service.ts)
  - [`backend/src/models/User.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/User.ts)
  - [`backend/src/models/SystemSettings.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/SystemSettings.ts)
- **Description**:
  SkillKart enforces a platform moderation standard where teaching privileges require vetting. In System Settings, `requireInstructorApproval: true` defaults to requiring prospective instructors to submit an application dossier (`primaryTopic`, `experienceDetails`, `sampleVideoOrPortfolioUrl`) that must be evaluated and approved by an administrator at `/admin/instructor-reviews`.
  However, the user onboarding flow completely circumvents this approval gate:
  1. In `OnboardingPage.tsx:145-172`, Step 0 prompts every newly registered user: *"Choose your primary role: Student or Instructor"*.
  2. When a user clicks "👨‍🏫 Instructor" and finishes the 3 onboarding steps, the frontend dispatches `POST /api/onboarding/complete` with `{ role: "instructor", headline: "...", ... }`.
  3. In `onboardingController.ts:37-56`:
     ```typescript
     const allowedRoles = ["student", "instructor"];
     const normalizedRole = allowedRoles.includes(role) ? role : undefined;
     ...
     if (normalizedRole) {
       updateData.role = normalizedRole;
     }
     const user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true });
     ```
     The controller updates `user.role = "instructor"` unconditionally!
  4. It never checks `SystemSettings.requireInstructorApproval`. It never collects an instructor application dossier. It leaves `isInstructorApproved = false` and `instructorStatus = "none"`.
  5. The newly onboarded user immediately gains access to `/instructor/create-course` and all instructor studio routes.
  This allows any newly registered user to self-promote to Instructor without admin vetting, flooding the course marketplace with unmoderated content while leaving the Admin Instructor Review queue completely bypassed.
- **Reproduction Steps**:
  1. As Admin, ensure `requireInstructorApproval: true` in `/admin/settings`.
  2. Open an incognito browser window and sign up for a new account.
  3. The browser automatically navigates to `/onboarding`.
  4. In Step 0 ("Choose your primary role"), click the "👨‍🏫 Instructor" card.
  5. Enter a headline, bio, and interests, and click "Complete Setup".
  6. Observe that you are immediately granted the Instructor role: the top navigation renders "Instructor Studio", and you can navigate directly to `/instructor/create-course`.
  7. Log in as Admin and open `/admin/instructor-reviews`: the queue is empty; no application dossier exists for this instructor.
- **Remediation**:
  - In `onboardingController.ts`, check `SystemSettings.requireInstructorApproval`:
    - If `requireInstructorApproval === true` and `role === "instructor"`: do **not** set `user.role = "instructor"`. Keep `user.role = "student"`, set `user.instructorStatus = "pending"`, and return an instructional flag informing the client that teaching privileges require admin approval.
    - Alternatively, restrict `onboardingController.ts` from mutating `role` entirely; all new users join as `student`, and prospective instructors must apply via the dedicated vetting modal (`applyForInstructor`).
  - In `OnboardingPage.tsx`, if the user selects "Instructor", display an informative callout (*"Teaching on SkillKart requires an approved instructor profile. You'll complete a brief teaching application after onboarding."*), and redirect them to `/profile?apply=instructor` upon completion.
- **Resolution**:
  - `backend/src/controllers/auth/onboardingController.ts`: Checks `SystemSettings.requireInstructorApproval`. If `requireInstructorApproval` is true, newly onboarded users who chose instructor role remain `role = "student"`, `isInstructorApproved = false`, and `instructorStatus = "pending"`. Initializes an `instructorApplication` dossier with provided profile headline, bio, and social links so the admin review queue contains actionable data. If auto-approval is enabled (`requireInstructorApproval === false`), grants `role = "instructor"`, `isInstructorApproved = true`, and `instructorStatus = "approved"`. Returns `requiresApproval` flag and synchronized user model.
  - `frontend/src/features/auth/auth.api.ts` & `frontend/src/features/auth/auth.service.ts`: Updated `AuthUser` and `CompleteOnboardingResponse` to type `instructorStatus`, `isInstructorApproved`, `instructorApplication`, and response flags.
  - `frontend/src/pages/OnboardingPage.tsx`: Added informative callout box on Step 0 when Instructor card is selected (*"Teaching on SkillKart requires an approved instructor profile. You'll complete a brief teaching application after onboarding."*). In `handleSubmit`, synchronizes `instructorStatus` and `isInstructorApproved` in AuthContext and routes pending instructors to `/profile?apply=instructor` with informative toast.
- **Status**: Completed (`[x]`)

---

#### AUDIT-72: Silent Instructor Feedback Data Loss in Assignment Gradebook via Payload Key Mismatch
- **Category**: Data Corruption & Silent State Discard
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Student
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/Assignments.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Assignments.tsx#L236,L265-L270)
  - [`frontend/src/features/instructor/api/assignments.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/api/assignments.ts#L124-L129)
  - [`backend/src/validators/assignmentValidator.ts`](file:///c:/Users/user/projects/skillkart/backend/src/validators/assignmentValidator.ts#L54-L58)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L468-L475)
  - [`frontend/src/features/student/components/CourseAssignmentsTab.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/components/CourseAssignmentsTab.tsx#L247-L265,L295-L330)
- **Description**:
  A critical naming inconsistency between the frontend state and backend Zod validation schema silently discards all instructor grading feedback, notes, and guidance every time an instructor saves a grade:
  1. In `Assignments.tsx:265-270`:
     ```typescript
     await gradeStudentSubmission(selectedSubmission._id, {
       score,
       status: gradingStatus,
       feedback: instructorFeedback,
       rubricScores: formattedRubricScores,
     });
     ```
     The frontend dispatches the payload property as `feedback`.
  2. In `backend/src/validators/assignmentValidator.ts:54-58`:
     ```typescript
     export const gradeSubmissionSchema = z.object({
       score: z.number().min(0),
       status: z.enum(["graded", "resubmission_requested"]).default("graded"),
       instructorFeedback: z.string().max(3000).optional().default(""),
       rubricScores: z.array(...).optional().default([]),
     });
     ```
     The Zod schema expects `instructorFeedback`. Because `feedback` is not defined in the schema, Zod strips `feedback` as an unrecognized key and populates `parsed.data.instructorFeedback` with its default value `""`.
  3. In `assignmentController.ts:468`:
     `submission.instructorFeedback = parsed.data.instructorFeedback;`
     This writes `""` into MongoDB, completely erasing whatever comments the instructor typed!
  4. In `Assignments.tsx:236`:
     `setInstructorFeedback(submission.feedback || '');`
     When the instructor reopens the grading modal, it reads `submission.feedback` instead of `submission.instructorFeedback`. Since the API response returns `instructorFeedback`, the textarea is populated with an empty string.
  5. In `CourseAssignmentsTab.tsx:247`:
     `{sub && sub.status === 'graded' && (...) }`
     The student feedback panel only renders when `status === 'graded'`. When an instructor selects `status: 'resubmission_requested'`, the feedback card is completely omitted from the student view. Students see that a resubmission was requested but are blocked from reading the instructor's instructions.
- **Reproduction Steps**:
  1. As instructor, navigate to `/instructor/assignments` and click "Grade" on a student submission.
  2. Type a multi-paragraph critique in "Instructor Feedback & Guidance" explaining code defects.
  3. Click "Save & Return Grade". A green toast says "Submission graded successfully!".
  4. Click "Grade" again on the same submission: observe that the feedback textarea is completely empty.
  5. Check MongoDB: `instructorFeedback` is `""`. All instructor comments were discarded.
  6. As student, open the course assignments tab: no feedback is visible.
- **Remediation**:
  - In `Assignments.tsx:268`, change `feedback: instructorFeedback` to `instructorFeedback: instructorFeedback`.
  - In `Assignments.tsx:236`, change `submission.feedback` to `submission.instructorFeedback`.
  - In `CourseAssignmentsTab.tsx:247`, expand the feedback visibility condition:
    `{sub && (sub.status === 'graded' || sub.status === 'resubmission_requested') && sub.instructorFeedback && (...) }`
  - In `CourseAssignmentsTab.tsx:300`, display the instructor's feedback inside the student's resubmission modal so they can consult it while attaching revisions.

---

#### AUDIT-73: Instructor Application Modal Crash for Students with Already Pending Applications
- **Category**: Conflicting UI Indicators & Error Handling Desync
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Pending Instructor
- **Affected Files**:
  - [`frontend/src/pages/Profile.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/Profile.tsx#L66-L72,L634-L648)
  - [`backend/src/controllers/user/userController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/user/userController.ts#L289-L291)
  - [`frontend/src/components/common/UserDropdown.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/UserDropdown.tsx#L238)
- **Description**:
  In `Profile.tsx:66-72`, the component includes an effect to auto-open the instructor application modal when accessed via query parameters:
  ```typescript
  if (searchParams.get('apply') === 'instructor') {
    setActiveTab('teaching');
    if (user?.role === 'student') {
      setIsApplyModalOpen(true);
    }
  }
  ```
  This check evaluates only `user?.role === 'student'`, completely ignoring `user?.instructorStatus`.
  If a student has already applied to teach and their application is currently under admin review (`instructorStatus: "pending"`):
  1. Visiting `/profile?apply=instructor` (via email link, browser bookmark, or banner) pops open the full application modal.
  2. The student is misled into believing they need to submit again, and spends time re-filling topic, experience, and portfolio fields.
  3. Upon clicking "Submit Application", `userController.ts:289` rejects the request with `400 Bad Request`:
     `"Your instructor application is already submitted and under review"`.
  4. The student is presented with a red error toast, creating frustration and confusion.
- **Reproduction Steps**:
  1. Log in as a student and submit an instructor application. Status is now `"pending"`.
  2. Navigate to `/profile?apply=instructor` in the URL bar.
  3. Notice the instructor application modal opens immediately over the screen.
  4. Fill out the application form again and click "Submit Application".
  5. The form fails with a 400 error toast: *"Your instructor application is already submitted and under review"*.
- **Remediation**:
  - In `Profile.tsx:68`, guard the auto-open check:
    ```typescript
    if (user?.role === 'student' && user?.instructorStatus !== 'pending' && user?.instructorStatus !== 'approved') {
      setIsApplyModalOpen(true);
    }
    ```
  - If `user?.instructorStatus === 'pending'`, keep the modal closed and focus on the existing "Application Under Review" card in the Teaching tab.

---

#### AUDIT-74: Notification Deep-Link Dead End for Instructor Student Enrollments
- **Category**: Phantom Actions & Broken Deep Links
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L78,L113)
  - [`frontend/src/App.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/App.tsx#L91)
  - [`frontend/src/features/instructor/pages/StudentsEnrolled.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/StudentsEnrolled.tsx#L25-L45)
- **Description**:
  When a student enrolls in a course or reactivates a previously cancelled enrollment, `enrollmentController.ts:78` and `line 113` creates an in-app notification for the course instructor:
  ```typescript
  link: `/instructor/courses/${course._id}/students`
  ```
  However, in `App.tsx:91`, the only instructor student roster route registered in React Router is:
  ```tsx
  <Route path="students" element={<StudentsEnrolled />} />
  ```
  There is **no route** matching `/instructor/courses/:courseId/students`. When an instructor receives an in-app notification that a new student has joined their course and clicks the notification link, the router fails to match any instructor route and lands on a dead-end 404 "Page Not Found", completely breaking the instructor's workflow when checking student enrollment details.
- **Reproduction Steps**:
  1. As a student, enroll in Course A (instructor is User B).
  2. Log in as User B (instructor) and click on the notification bell in the header.
  3. Notice the notification: *"New student enrolled in Course A"*.
  4. Click the notification link.
  5. The application navigates to `/instructor/courses/<courseId>/students` and displays a dead-end 404 page.
- **Remediation**:
  - In `backend/src/controllers/enrollment/enrollmentController.ts:78,113`, update the notification link target to `/instructor/students?courseId=${course._id}`.
  - In `frontend/src/features/instructor/pages/StudentsEnrolled.tsx:25`, parse `searchParams.get('courseId')` so that if a `courseId` query parameter is present, `selectedCourseFilter` is automatically set to that course, immediately filtering the student table to the enrolled course.
  - In `frontend/src/App.tsx`, optionally add a redirect route `<Route path="courses/:courseId/students" element={<Navigate to="/instructor/students" replace />} />` as a defensive alias.

---

#### AUDIT-75: Student Order History Schema Field Desync (`thumbnail` vs `thumbnailUrl`)
- **Category**: Conflicting UI Indicators & Broken Media
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L393,L419)
  - [`backend/src/models/Course.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Course.ts#L48-L51)
  - [`frontend/src/pages/PurchaseHistoryPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/PurchaseHistoryPage.tsx#L188-L195,L275-L285)
- **Description**:
  In `backend/src/controllers/orderController.ts:393`, the student purchase order history endpoint populates course items with:
  ```typescript
  const orders = await Order.find({ student: req.user.id })
    .populate("items.course", "title thumbnail")
    .sort({ createdAt: -1 })
    .lean();
  ```
  On the `Course` model (`backend/src/models/Course.ts:48`), the schema field is declared as `thumbnailUrl: { type: String, trim: true }`. There is **no `thumbnail` field** on the Course schema. Because Mongoose projection strictly selects only `title` and the non-existent field `thumbnail`, `course.thumbnailUrl` is omitted (`undefined`) from all returned order item courses.
  In `PurchaseHistoryPage.tsx`, the order card attempts to render `<img src={item.course?.thumbnailUrl} />` (or `item.thumbnailUrl`), which evaluates to `undefined`, causing the cover image to fail or fall back to an empty placeholder box across all past orders. Additionally, `getOrderReceipt` (`orderController.ts:419`) populates only `"title instructor"`, likewise omitting `thumbnailUrl`.
- **Reproduction Steps**:
  1. Complete a purchase of a course that has a valid cover image.
  2. Navigate to `/purchase-history` (or click "Purchase History" from the student profile dropdown).
  3. Inspect the purchase card and line items: each course shows an empty gray square / generic fallback icon rather than the course cover thumbnail.
  4. Inspect the network response for `GET /api/orders/history`: `items[0].course` contains `{ _id, title }` with `thumbnailUrl` missing.
- **Remediation**:
  - In `backend/src/controllers/orderController.ts:393`, change `.populate("items.course", "title thumbnail")` to `.populate("items.course", "title thumbnailUrl")`.
  - In `backend/src/controllers/orderController.ts:419`, update the receipt query to include `thumbnailUrl`: `.populate("items.course", "title instructor thumbnailUrl")`.

---

#### AUDIT-76: Google OAuth Password Setting Form Barrier & Schema Rejection
- **Category**: Unhandled Lifecycle Transitions & Validation Roadblocks
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor, Admin
- **Affected Files**:
  - [`frontend/src/pages/Profile.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/Profile.tsx#L536-L586)
  - [`backend/src/validators/content.validator.ts`](file:///c:/Users/user/projects/skillkart/backend/src/validators/content.validator.ts#L16-L19)
  - [`backend/src/controllers/auth/authController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/authController.ts#L164-L168)
- **Description**:
  In `authController.ts:164-168`, the backend contains deliberate logic to support users who originally signed in with Google OAuth (and therefore have no local password hash) to set an initial password:
  ```typescript
  if (!user.password) {
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: "Password set successfully" });
  }
  ```
  However, this pathway is entirely blocked by two conflicting layers:
  1. In `content.validator.ts:17`, `changePasswordSchema` strictly mandates:
     ```typescript
     currentPassword: z.string().min(1, "Current password is required"),
     ```
     Omitting `currentPassword` immediately triggers a `400 Bad Request` validation error from the API middleware before `authController.ts` is reached.
  2. In `Profile.tsx:543`, the "Current Password" `<input>` is marked with HTML5 `required`. The UI gives no visual indication that the user logged in via OAuth or needs to "Set" rather than "Change" their password. An OAuth user has no current password to provide. If they leave it blank, browser validation blocks submission. If they type dummy characters, backend Zod schema passes but `bcrypt.compare` fails or Zod validation errors occur.
- **Reproduction Steps**:
  1. Register an account using Google OAuth. The user document has `googleId` populated and `password` undefined.
  2. Navigate to `/profile` and select the **Security** tab.
  3. Attempt to set a password to enable email/password login.
  4. Notice the form demands "Current Password *".
  5. If left empty, form submission is blocked. If dummy text is typed, the request fails with 400 *"Invalid current password"*. The OAuth user is permanently blocked from setting a local password.
- **Remediation**:
  - In `backend/src/validators/content.validator.ts:16-19`, make `currentPassword` optional in `changePasswordSchema`:
    ```typescript
    currentPassword: z.string().optional(),
    ```
  - In `backend/src/controllers/auth/authController.ts:160-175`, enforce `currentPassword` verification only when `Boolean(user.password)` is true. If `!user.password`, allow setting `newPassword` directly without requiring `currentPassword`.
  - In `frontend/src/pages/Profile.tsx:536-586`, check whether the user has a local password (or `!user?.googleId`). If the user has no existing password, hide the "Current Password" field and change button copy from "Update Password" to "Set Local Password".

---

#### AUDIT-77: AuthContext Desync on Profile Fetch Drops `instructorApplication` Historical State
- **Category**: Multi-Role Inconsistencies & State Loss
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Affected Files**:
  - [`frontend/src/pages/Profile.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/Profile.tsx#L112-L118)
  - [`frontend/src/features/auth/AuthContext.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/AuthContext.tsx#L23,L108-L115)
- **Description**:
  When a student loads `/profile`, `Profile.tsx:100-120` runs `fetchProfile`, querying `GET /api/users/profile`. The backend response includes the user's complete `instructorApplication` record (containing previous topics, bio, experience years, portfolio links, and status).
  However, at line 112, `Profile.tsx` calls `updateUser` with a cherry-picked subset:
  ```typescript
  updateUser({
    role: userData.role,
    instructorStatus: userData.instructorStatus,
    isInstructorApproved: userData.isInstructorApproved,
    instructorRejectionReason: userData.instructorRejectionReason,
  });
  ```
  `instructorApplication` is omitted. When `updateUser` executes in `AuthContext.tsx:108`, the existing `user` in React state is replaced or merged without `instructorApplication`.
  Later, when a rejected applicant clicks **"Reapply to Become an Instructor"** (`Profile.tsx:680`), the handler attempts to populate the modal with:
  ```typescript
  setAppTopic(user?.instructorApplication?.topic || '');
  setAppExperience(user?.instructorApplication?.experienceYears?.toString() || '');
  setAppPortfolio(user?.instructorApplication?.portfolioUrl || '');
  ```
  Because `instructorApplication` was erased from `AuthContext` state on mount, all fields initialize to empty strings, forcing the rejected applicant to re-type their entire bio, portfolio, and experience from scratch.
- **Reproduction Steps**:
  1. Log in as a student and submit an instructor application with extensive portfolio URLs, topic, and experience.
  2. As admin, reject the application with feedback.
  3. As student, navigate to `/profile`. `fetchProfile` executes and calls `updateUser`.
  4. In the Teaching tab, click **"Reapply to Become an Instructor"**.
  5. The reapply modal opens with completely blank inputs instead of prefilling the student's previous submission for revision.
- **Remediation**:
  - In `frontend/src/pages/Profile.tsx:112-118`, pass `instructorApplication: userData.instructorApplication` to `updateUser`:
    ```typescript
    updateUser({
      role: userData.role,
      instructorStatus: userData.instructorStatus,
      isInstructorApproved: userData.isInstructorApproved,
      instructorRejectionReason: userData.instructorRejectionReason,
      instructorApplication: userData.instructorApplication,
    });
    ```
  - In `frontend/src/features/auth/AuthContext.tsx:14-33`, ensure the `User` interface declares `instructorApplication?: IInstructorApplication` to maintain TypeScript fidelity.

---

#### AUDIT-78: Unhandled Instructor Demotion & Deactivation Lifecycle Cascade on Published Catalog Courses
- **Category**: Mismatched Lifecycle States & Unhandled Transitions
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor, Student
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L90-L130,L164-L168)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L330-L365)
  - [`frontend/src/features/admin/pages/UserManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/UserManagement.tsx#L170-L210)
- **Description**:
  In `adminController.ts`, when an administrator changes a user's role from `"instructor"` back to `"student"` via `PATCH /admin/users/:userId/role`, or deactivates an instructor account via `PATCH /admin/users/:userId/status`, the controller alters the user record but performs **zero cascading lifecycle handling on their existing published courses**.
  As a result:
  1. All courses created by the demoted or banned instructor remain `status: "published"` and `isActive: true` in the public marketplace catalog.
  2. Students continue discovering, purchasing, and enrolling in courses authored by a user who has been demoted or banned.
  3. The demoted/banned instructor cannot access `/instructor/dashboard`, `/instructor/assignments`, or `/instructor/discussions`. Any questions asked by students or submissions uploaded go completely unmonitored and ungraded.
  4. In `UserManagement.tsx`, no confirmation prompt warns the administrator that demoting or deactivating the instructor will leave published courses orphaned in the catalog.
- **Reproduction Steps**:
  1. Instructor creates and publishes Course A with assignments and discussions.
  2. Administrator navigates to `/admin/users` and demotes the instructor to `"student"`, or sets their status to inactive.
  3. As a guest or student, visit `/courses` and search for Course A: the course remains listed as live with active "Enroll Now" / "Add to Cart" buttons.
  4. Student purchases Course A and submits an assignment: the assignment is orphaned because the author no longer has instructor permissions to review it.
- **Remediation**:
  - In `backend/src/controllers/admin/adminController.ts:updateUserRole`, if a user's role is demoted from `instructor` to `student`, automatically transition their published courses to `status: "draft"` or set `isActive: false`, and record the event in the admin audit log.
  - In `backend/src/controllers/admin/adminController.ts:updateUserStatus`, when an instructor is deactivated (`isActive: false`), bulk-disable their published courses:
    ```typescript
    await Course.updateMany({ instructor: user._id, isActive: true }, { isActive: false });
    ```
  - In `frontend/src/features/admin/pages/UserManagement.tsx`, display a confirmation modal warning the admin: *"Demoting or deactivating this instructor will automatically suspend their published courses from the marketplace catalog."*

---

#### AUDIT-79: Hardcoded 80% Commission Copy in Instructor Earnings UI Desynchronized from System Settings
- **Category**: Conflicting UI Indicators & Financial Misrepresentation
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/EarningsAndPayouts.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EarningsAndPayouts.tsx#L262,L501)
  - [`backend/src/models/SystemSettings.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/SystemSettings.ts#L43-L45)
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L18-L45)
- **Description**:
  In `backend/src/models/SystemSettings.ts`, the platform allows administrators to dynamically configure revenue sharing via `platformCommissionRate` and `instructorPayoutShare` (which default to 20% and 80%, but can be modified to custom percentages, e.g. 15% platform / 85% instructor or 30% platform / 70% instructor).
  In `backend/src/controllers/orderController.ts:108`, order earnings and payouts are computed dynamically from `SystemSettings`.
  However, in `EarningsAndPayouts.tsx`, static copy is hardcoded in multiple places:
  - Line 262: `Track your 80% course revenue take-home and request withdrawals.`
  - Line 501: `<th ...>Your Net Earnings (80%)</th>`
  If an administrator customizes the platform revenue share in `/admin/settings`, transactions are credited based on the new percentage, but the instructor UI continues to display "80%", creating confusion, distrust, and financial support disputes.
- **Reproduction Steps**:
  1. As admin, navigate to `/admin/settings` and update `instructorPayoutShare` to `70%`.
  2. Log in as an instructor and navigate to `/instructor/earnings`.
  3. Notice the top subtitle says: *"Track your 80% course revenue take-home..."*.
  4. Notice the transactions table column header says: *"Your Net Earnings (80%)"*, even though transaction math calculates at 70%.
- **Remediation**:
  - In `backend/src/controllers/instructor/instructorEarningsController.ts`, include `instructorPayoutShare` from `SystemSettings` in the earnings summary response object.
  - In `frontend/src/features/instructor/pages/EarningsAndPayouts.tsx:262,501`, replace hardcoded "80%" with the dynamic value `{summary?.instructorPayoutShare ?? 80}%`.

---

#### AUDIT-80: Instructor Lesson Q&A Notification Routes to Student Learner Viewer Without Instructor Management Context
- **Category**: Broken Navigation & Mismatched Multi-Role Contexts
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Student
- **Affected Files**:
  - [`backend/src/controllers/course/commentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/commentController.ts#L173-L181)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L105,L445-L450)
- **Description**:
  When a student posts a question or comment on a lesson, `commentController.ts:175` generates an in-app notification for the course instructor:
  ```typescript
  link: `/learn/${courseId}/${lessonId}`
  ```
  This link routes the instructor directly into the student-facing `LessonViewer` player UI (`/learn/:courseId/:lessonId`).
  In `LessonViewer.tsx:105`, `activeTab` defaults unconditionally to `'lesson'`. The player begins buffering video playback, marks lessons as viewed, and evaluates quiz completion gates as if the instructor were a student learner.
  Because there is no query param parsing (e.g. `?tab=discussion`), the instructor lands on the video player rather than the discussion thread they were notified about. The instructor must manually locate and click the "Discussion" tab to find the student's question.
- **Reproduction Steps**:
  1. Student posts a question in lesson discussion for Course A.
  2. Course instructor clicks the new comment notification: *"New question on [Lesson Title]"*.
  3. Browser navigates to `/learn/:courseId/:lessonId`.
  4. The video starts playing on the default "Lesson" tab; the discussion tab is closed.
  5. The instructor is presented with student completion popups and enrollment progress bars rather than an instructor management view.
- **Remediation**:
  - In `backend/src/controllers/course/commentController.ts:176`, update the notification link to include tab navigation:
    ```typescript
    link: `/learn/${courseId}/${lessonId}?tab=discussion`
    ```
  - In `frontend/src/features/student/pages/LessonViewer.tsx`, parse `searchParams.get('tab')` on mount or param change to automatically activate the `'discussion'` tab.

---

#### AUDIT-81: Cart Coupon Discount Desynchronization on Cart Modification (Item Removal / Upsell Addition)
- **Category**: State-Synchronization & Checkout Inconsistencies
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Affected Files**:
  - [`frontend/src/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/CartPage.tsx#L93-L95,L116-L154,L445,L511)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L130-L160)
- **Description**:
  In `frontend/src/pages/CartPage.tsx`, when a user enters a promo code, `handleApplyCoupon` calls `validateCouponCode(code, courseIds)` and saves the result in local state `appliedCoupon`, which stores a frozen snapshot of `discountTotal`.
  However, `CartPage.tsx` contains **no effect to re-validate or clear `appliedCoupon` when items in `cart` change**:
  1. If a student applies a 50% discount coupon valid for Course A ($100), `appliedCoupon.discountTotal` is $50.
  2. The student then clicks "Remove" on Course A (`removeFromCart(item.courseId)` at line 445), leaving only Course B ($25).
  3. `cartTotal` becomes $25, but `appliedCoupon.discountTotal` remains $50!
  4. The UI displays: Subtotal $25, Coupon -$50, Total: $0.
  5. When the student proceeds to payment and clicks "Complete Order", the backend in `orderController.ts:checkout` validates the coupon against the current cart items. Because Course A is gone, backend validation fails with `400 Bad Request` (*"Coupon is not applicable to any courses in this order"*).
  6. The checkout is aborted, the user is thrown back to step 1, and the coupon is stripped only after a failed checkout transaction attempt.
  Conversely, adding a course via "Frequently Bought Together" does not update percentage coupons, shortchanging the student on valid savings until they manually remove and re-apply the code.
- **Reproduction Steps**:
  1. Add Course A ($100) and Course B ($30) to cart.
  2. Apply a course-specific coupon valid only for Course A ($50 discount). Total displays $80.
  3. Click "Remove" on Course A.
  4. Cart now contains only Course B ($30). Observe that the coupon discount remains -$50 and final total displays $0.00.
  5. Click "Proceed to Payment" and submit checkout.
  6. Checkout fails with error toast: *"This coupon is only valid for a specific course that is not in your cart."*
- **Remediation**:
  - In `frontend/src/pages/CartPage.tsx`, add a `useEffect` watching `cart`:
    ```typescript
    useEffect(() => {
      if (appliedCoupon && cart.length > 0) {
        // Silently re-validate coupon against updated cart items
        validateCouponCode(appliedCoupon.code, cart.map((c) => c.courseId))
          .then((res) => {
            if (res.valid) {
              setAppliedCoupon((prev) => prev ? { ...prev, discountTotal: res.discountTotal } : null);
            }
          })
          .catch(() => {
            // Coupon no longer valid for updated cart items
            setAppliedCoupon(null);
            toast.info('Applied coupon was removed because eligible items were removed from your cart.');
          });
      } else if (cart.length === 0 && appliedCoupon) {
        setAppliedCoupon(null);
      }
    }, [cart]);
    ```
  - This ensures discounts stay synchronized in real-time as items are added or removed.

---

#### AUDIT-82: Order Checkout Bypasses Instructor Enrollment Notifications, Confirmation Emails, & Learning Streak Activity
- **Category**: Multi-Role Lifecycle Desynchronization & Notification Void
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L351-L405)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L106-L141)
  - [`backend/src/services/emailService.ts`](file:///c:/Users/user/projects/skillkart/backend/src/services/emailService.ts)
  - [`backend/src/services/streakService.ts`](file:///c:/Users/user/projects/skillkart/backend/src/services/streakService.ts)
- **Description**:
  When a student enrolls in a course through `enrollmentController.ts:enrollCourse`, three essential cross-system side effects occur: (1) `Notification.create` notifies the instructor with `"New Student Enrolled"` linking to `/instructor/students?courseId=...`; (2) `sendEnrollmentEmail` delivers a transactional confirmation email to the student with course details; and (3) `recordUserActivity(req.user.id)` logs daily active participation for student learning streak tracking.
  In contrast, when a student completes paid checkout in `orderController.ts:checkout`, the controller creates or reactivates `Enrollment` records, but **never notifies the instructors**, **never triggers `sendEnrollmentEmail`**, and **never calls `recordUserActivity`**. Instructors have no indication that paying students enrolled in their courses until they inspect analytics, paying students receive no enrollment confirmation receipt, and student learning streaks are not credited on purchase.
- **Reproduction Steps**:
  1. As an instructor, publish a paid course.
  2. As a student, add the course to the cart and complete checkout.
  3. Log in as the instructor and inspect the notification bell: observe 0 notifications received.
  4. Inspect student email logs and learning streak: observe no enrollment confirmation email sent and 0 streak activity logged.
- **Remediation**:
  - In `orderController.ts:checkout`, iterate through newly created/reactivated enrollments and:
    - Dispatch instructor notification: `Notification.create({ recipient: course.instructor, type: "info", title: "New Student Enrolled", message: `${studentName} enrolled in "${course.title}".`, link: `/instructor/students?courseId=${course._id}` })`.
    - Send confirmation email: `await sendEnrollmentEmail(req.user.email, req.user.name, course.title, course._id.toString())`.
    - Record student streak activity: `await recordUserActivity(req.user.id)`.

---

#### AUDIT-83: Guest Cart Merging Drops Repurchasable Cancelled Enrollments
- **Category**: State-Synchronization & Cart Inconsistency
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Guest
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cartController.ts#L332-L364)
- **Description**:
  In `cartController.ts:addToCart`, existing enrollments are checked using `{ status: { $in: ["active", "completed"] } }`, allowing students who previously cancelled/unenrolled from a course to re-add it to their cart and repurchase. However, in `cartController.ts:mergeCart` (line 334), the query remains:
  ```typescript
  const enrollments = await Enrollment.find({
    student: req.user.id,
    course: { $in: validCourseIds },
  }).select("course").lean();
  ```
  Because this query lacks the `status` filter, any course the user previously cancelled is treated as an "already enrolled" course and is silently stripped from the guest cart upon login without warning, preventing repurchasing via the guest-to-authenticated flow.
- **Reproduction Steps**:
  1. Enroll in Course A and subsequently cancel enrollment (status becomes `"cancelled"`).
  2. Log out of the account.
  3. As a guest, add Course A to the cart.
  4. Log in as the student from step 1.
  5. Open `/cart`; observe Course A was stripped and the cart is empty with no explanation.
- **Remediation**:
  - In `cartController.ts:mergeCart`, restrict the enrollment lookup to active or completed statuses:
    ```typescript
    const enrollments = await Enrollment.find({
      student: req.user.id,
      course: { $in: validCourseIds },
      status: { $in: ["active", "completed"] },
    }).select("course").lean();
    ```

---

#### AUDIT-84: Category Public Course Counts Omit Direct `category` Foreign Keys
- **Category**: Data Mismatch & Misleading Indicators
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Guest, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/category/categoryController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/category/categoryController.ts#L27-L48, L85-L96)
- **Description**:
  In `categoryController.ts:getAdminCategories`, courses attached to a category via `course.category === cat._id` are accurately counted. However, in `categoryController.ts:getPublicCategories` (which feeds the homepage category grid and explorer pills), line 32 projects only `Course.find({ status: "published", isActive: true }).select("title description tags")`. It completely omits the `category` field from the query and attempts to match courses solely via keyword string matches across title, description, and tags.
  Any course explicitly assigned to a category whose title or description does not explicitly duplicate the category name is counted as 0 on the public storefront.
- **Reproduction Steps**:
  1. As instructor, create a course assigned to category "Development", but titled "Python Mastery: Build 10 Real Projects" with description "Hands-on coding for all levels".
  2. As guest/student, view the Categories section on the home page or browse `/courses`.
  3. The "Development" track card shows "0 Courses" despite having active published courses assigned to it.
- **Remediation**:
  - In `categoryController.ts:getPublicCategories`, add `category` to the `.select()` projection: `.select("title description tags category")`.
  - Update course matching logic to check `(c.category && c.category.toString() === catIdStr)` in addition to keyword tags, matching the behavior of `getAdminCategories`.

---

#### AUDIT-85: Admin Enrollment Oversight Table Drops Progress Percentage via Virtual Stripping & Lacks Server Pagination
- **Category**: Data Truncation & Scalability Hazard
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L416-L428)
  - [`frontend/src/features/admin/pages/EnrollmentList.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/EnrollmentList.tsx#L8-L24, L42-L46)
- **Description**:
  In `adminController.ts:getEnrollments`, `Enrollment.find().sort({ createdAt: -1 }).lean()` fetches all platform enrollments. Using `.lean()` strips Mongoose virtual fields; consequently, the `progressPercentage` virtual defined on `Enrollment` is omitted from the JSON payload.
  In `EnrollmentList.tsx`, line 44 binds `enrollment.progressPercentage || 0`, causing every student across the entire institution to display 0% progress on the admin monitoring console. Additionally, unbounded fetching without `page` and `limit` query parameters creates memory spikes and degrades API response times as enrollment counts grow.
- **Reproduction Steps**:
  1. Student completes 80% of a course.
  2. Admin navigates to `/admin/enrollments`.
  3. Find the student's enrollment record; observe progress displays `0%` with an empty progress bar.
- **Remediation**:
  - In `adminController.ts:getEnrollments`, compute `progressPercentage` dynamically or populate virtuals (`totalLessonsCount > 0 ? Math.round((completedLessons.length / totalLessonsCount) * 100) : 0`).
  - Add query pagination (`page`, `limit`) with standard total count metadata, and update `EnrollmentList.tsx` with pagination controls.

---

#### AUDIT-86: Student Course Unenrollment Leaves Instructors Blind Without Notification or Roster Update Event
- **Category**: Multi-Role Lifecycle Desynchronization & Notification Gap
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L394-L442)
- **Description**:
  When a student cancels an enrollment via `enrollmentController.ts:cancelEnrollment`, the controller updates status to `"cancelled"`, drops wishlist/cart artifacts, and notifies the student (`"Enrollment Cancelled"`). However, **zero notification is sent to the course instructor**.
  Instructors who communicate with students or monitor cohort retention receive no notice when students drop out of their courses, creating conflicting expectations between student actions and instructor tracking.
- **Reproduction Steps**:
  1. Student cancels enrollment in an active course via `/my-learning`.
  2. Student receives cancellation confirmation notification.
  3. Instructor checks notification bell and dashboard; no notification is generated to inform the instructor of the student's unenrollment.
- **Remediation**:
  - In `enrollmentController.ts:cancelEnrollment`, look up the course instructor and create an informational notification:
    ```typescript
    await Notification.create({
      recipient: course.instructor,
      type: "info",
      title: "Student Left Course",
      message: `${req.user.name} has cancelled their enrollment in "${course.title}".`,
      link: `/instructor/students?courseId=${course._id}`,
    });
    ```

---

#### AUDIT-87: Instructor Payout Submission Lacks Audit Log and Notification Confirmation
- **Category**: Financial Auditability & Multi-Role Notification Gap
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L392-L415)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L57-L65)
- **Description**:
  When an instructor requests a payout via `requestInstructorPayout`, the controller creates a `Payout` document and decrements available earnings balance. However, unlike admin payout approvals/rejections (which generate `AuditLog` entries and notifications), the initial payout request:
  1. Generates **no audit log** recording the monetary debit and payout creation.
  2. Dispatches **no confirmation notification** to the requesting instructor.
  3. Dispatches **no notification to administrators** alerting them of a pending financial request.
- **Reproduction Steps**:
  1. As instructor with available balance, submit a payout request for $200.
  2. Check instructor notifications; no confirmation alert is received.
  3. Log in as admin and check Audit Logs; no entry records the payout request.
- **Remediation**:
  - In `requestInstructorPayout`, record an `AuditLog` (`action: "PAYOUT_REQUESTED"`), send a confirmation notification to the instructor with the payout ID and amount, and dispatch a notification to platform admins.

---

#### AUDIT-88: Category Filter Silently Overwritten by Search Queries and Unescaped Regex Crash
- **Category**: Search & Catalog Filter Corruption
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Guest
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L178-L182, L206, L217-L221)
  - [`frontend/src/pages/courses/CourseList.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseList.tsx#L199-L225)
- **Description**:
  1. In `courseController.ts:getCourses`, when a user selects a category without a price filter, lines 178–182 assign `filter.$or = categoryFilterConditions`. Later, if the user enters a search query `q`, lines 217–221 execute:
  ```typescript
  if (filter.$and) {
    (filter.$and as Array<Record<string, unknown>>).push({ $or: searchConditions });
  } else {
    filter.$or = searchConditions;
  }
  ```
  Since `filter.$and` is not initialized, `filter.$or = searchConditions` **completely overwrites** `filter.$or = categoryFilterConditions`. The category filter is destroyed and the catalog searches globally across all categories.
  2. In line 206, `new RegExp(searchQuery, "i")` compiles raw user input without escaping regex meta-characters. Searching for terms like `C++`, `[React]`, or `(Vue)` causes `SyntaxError: Invalid regular expression`, throwing an uncaught 500 Server Error.
- **Reproduction Steps**:
  1. Navigate to `/courses` and click category "Mobile Development".
  2. Type "React" into the search bar.
  3. Observe that courses from all categories (e.g., Web Development) are returned because the category filter was completely wiped.
  4. In the search box, enter `C++` or `Node.js (v20)`; observe an immediate 500 Server Error crash.
- **Remediation**:
  - Escape user input before compiling regex: `searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`.
  - Initialize `filter.$and = []` whenever combining multiple compound `$or` clauses (category conditions, price conditions, search conditions).

---

#### [x] AUDIT-89: Empty Lesson Course Publication Allows White Screen of Death Crash in Student Viewer
- **Category**: Unhandled Lifecycle Transition & Fatal Client Crash
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L453-L466, L520-L533)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx#L231-L240, L254-L263)
  - [`frontend/src/features/instructor/pages/CreateCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/CreateCourse.tsx#L384-L393, L407-L411)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L317-L368, L371-L388, L466-L470, L490)
- **Description**:
  In `courseController.ts:publishCourse`, lines 518–521 check only `await Section.exists({ course: course._id })`. Neither the backend nor `EditCourse.tsx` checks whether the sections actually contain any lessons. An instructor can publish a course containing empty sections.
  When an enrolled student navigates to `/learn/:courseId`, the course loads with `lessons = []`. In `LessonViewer.tsx:439` and `470`, the component attempts to render `activeLesson.title` without null checking (`activeLesson` is `undefined`), throwing an uncaught `TypeError: Cannot read properties of undefined (reading 'title')` and crashing the entire React application with a blank white screen.
- **Reproduction Steps**:
  1. As instructor, create a course, add 1 Section, and leave lessons empty.
  2. Click "Publish Course"; backend returns 200 OK and publishes the course.
  3. As student, enroll in the course and open `/learn/:courseId`.
  4. The page instantly white-screens due to uncaught TypeError on `activeLesson.title`.
- **Remediation**:
  - In `courseController.ts:publishCourse` and `updateCourse`, fetch section IDs and query `Lesson.exists({ section: { $in: sectionIds } })`, rejecting with 400 (`Cannot publish a course without lessons`) if a course has no lessons.
  - In `EditCourse.tsx` (`handlePublishOrSubmit` & `handleResubmitForModeration`) and `CreateCourse.tsx` (`handlePublish` & disabled button state), validate that `totalLessons > 0` before submitting.
  - In `LessonViewer.tsx`, add an empty-state card when `lessons.length === 0` informing students that the course does not have published lessons yet with a return button to the course overview, add safe empty-section indicators in the curriculum sidebar, and guard `activeLesson` access in tabs to prevent white-screen crashes.
- **Resolution Summary**:
  - **Backend**: Added validation in both `publishCourse` and `updateCourse` to ensure that at least one lesson exists in the course's sections before permitting publishing/moderation submission (`Lesson.exists({ section: { $in: sectionIds } })`), responding with 400 Bad Request if no lessons exist.
  - **Frontend Instructor**: Enforced pre-flight check for `totalLessons === 0` in `EditCourse.tsx` (`handlePublishOrSubmit`, `handleResubmitForModeration`) and `CreateCourse.tsx` (`handlePublish` and disabled publish button).
  - **Frontend Student**: Added empty-state card in `LessonViewer.tsx` when `lessons.length === 0` with a link back to course overview, added sidebar empty-section indicators, and guarded `activeLesson?.title` and `activeLesson &&` across tabs to prevent runtime `TypeError` crashes.

---

#### AUDIT-90: Quiz Completion Gate Desynchronization on Non-Quiz Lesson Types and Initial Page Load
- **Category**: Conflicting UI Indicators & State Desynchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Student
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L506)
  - [`frontend/src/components/LessonQuiz.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/LessonQuiz.tsx#L57-L62, L102)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L125-L138)
- **Description**:
  1. The backend enforces that any lesson with an attached `Quiz` document must be passed before progress can be marked complete (`progressController.ts:125-138`). However, frontend `LessonViewer.tsx:506` only disables the "Mark as Complete" button if `activeLesson.type === 'quiz'`. For video or article lessons with an attached quiz, the button is active; clicking it unexpectedly throws a 403 error toast: *"You must pass the quiz before marking this lesson complete"*.
  2. Furthermore, when a student revisits a lesson where they have already passed the quiz, `LessonQuiz.tsx:57-62` loads `res.data.latestAttempt` but **never invokes `onQuizPassed()`**. Consequently, `quizPassed` in `LessonViewer.tsx` remains `false`, permanently disabling the "Mark as Complete" button on `type === 'quiz'` lessons until the student re-submits the quiz.
- **Reproduction Steps**:
  1. Create a video lesson and attach a quiz assessment to it.
  2. As student, view the lesson; observe the green "Mark as Complete" button is active.
  3. Click "Mark as Complete"; request fails with a 403 error toast.
  4. Now pass the quiz on a `type === 'quiz'` lesson, refresh the browser; observe "Mark as Complete" is locked disabled despite displaying "Passed (100%)" in the quiz card.
- **Remediation**:
  - In `LessonQuiz.tsx`, call `if (res.data.latestAttempt?.passed) onQuizPassed?.()` upon initial fetch.
  - In `LessonViewer.tsx`, track `hasQuiz` state and disable "Mark as Complete" whenever a quiz exists and `!quizPassed`, regardless of `activeLesson.type`.

---

#### AUDIT-91: Instructor Students Enrolled Roster Misrepresents Cancelled Students as "In Progress" & Excludes Deactivated Courses
- **Category**: Misleading UI Status & Data Visibility Gap
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/instructor/instructorAnalyticsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorAnalyticsController.ts#L295, L307-L313)
  - [`frontend/src/features/instructor/pages/StudentsEnrolled.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/StudentsEnrolled.tsx#L135-L140)
- **Description**:
  1. In `instructorAnalyticsController.ts:getInstructorStudents`, line 295 restricts course lookup to `Course.find({ ...courseQuery, isActive: true })`. If an admin temporarily disables a course for review, all enrolled students for that course vanish from the instructor's student roster entirely.
  2. In lines 307–313, `Enrollment.find({ course: { $in: courseIds } })` does not filter by status, returning `status: "cancelled"` records.
  3. In `StudentsEnrolled.tsx:135-140`, the status badge ternary checks only:
  ```tsx
  student.status === 'completed' || student.progressPercentage === 100 ? 'Completed' : 'In Progress'
  ```
  Consequently, students who cancelled or unenrolled from the course are rendered with an active blue "In Progress" badge, deceiving instructors about current active learners.
- **Reproduction Steps**:
  1. Student cancels enrollment in Course A.
  2. Instructor opens `/instructor/students`.
  3. The cancelled student is displayed with a blue "In Progress" badge instead of "Cancelled" / "Dropped".
  4. Admin disables Course A; instructor refreshes `/instructor/students`; all students from Course A vanish from the roster.
- **Remediation**:
  - Allow instructors to view students across all owned courses (active and inactive).
  - Add explicit status badge handling for `status === 'cancelled'` in `StudentsEnrolled.tsx` with a muted gray/red "Cancelled" pill.

---

#### AUDIT-92: Marketplace Course Listing Inflates Student Counts and Desynchronizes with Course Details
- **Category**: Cross-View Data Desynchronization & Inaccurate Metrics
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Guest, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L274, L382-L385)
  - [`frontend/src/components/common/CourseCard.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/common/CourseCard.tsx#L27, L180-L185)
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L456-L460)
- **Description**:
  In `courseController.ts:getCourses` (line 274), the public course card query calculates `enrollmentCount = await Enrollment.countDocuments({ course: course._id })` without any status filter. Cancelled, dropped, and refunded enrollments are included, inflating the public count.
  In contrast, `courseController.ts:getCourseById` (line 382) calculates `studentCount = await Enrollment.countDocuments({ course: course._id, status: { $in: ["active", "completed"] } })`.
  This results in two conflicting issues: (1) field name desynchronization (`enrollmentCount` vs `studentCount`); and (2) numerical mismatch where course cards in the catalog display a higher student count than the course details page.
- **Reproduction Steps**:
  1. Have a course with 10 active enrollments and 5 cancelled enrollments.
  2. Open `/courses`; the course card displays "15 students".
  3. Click into the course (`/courses/:id`); the hero section displays "10 students".
- **Remediation**:
  - Standardize `getCourses` to filter `status: { $in: ["active", "completed"] }`.
  - Standardize both backend response payloads and frontend interfaces to use a consistent property (`studentCount` or `enrollmentCount`).

---

#### AUDIT-93: Admin Course Disablement Operates Silently Without Instructor Notification or Appeal Path
- **Category**: Conflicting UI Indicators & Multi-Role Notification Gap
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L362, L379-L402)
  - [`frontend/src/features/admin/pages/CourseModeration.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CourseModeration.tsx#L288-L297)
- **Description**:
  When an administrator disables an active course (`isActive = false`) in `CourseModeration.tsx`, `adminController.ts:updateCourseStatus` saves the state change but only creates notifications when `isApproved` changes.
  Zero notifications or explanations are sent to the course instructor. The course immediately vanishes from the marketplace catalog and search results without alerting the instructor, leaving them unaware that their course was taken offline.
- **Reproduction Steps**:
  1. Admin clicks "Disable" toggle on a published course in `/admin/moderation`.
  2. Log in as the course instructor and check notifications.
  3. No alert, notification, or audit trail is provided; the course has vanished from public view.
- **Remediation**:
  - In `updateCourseStatus`, when `isActive === false`, dispatch an urgent alert notification to the instructor explaining that their course was disabled by platform administration with instructions on how to reach support.

---

#### AUDIT-94: Course Deletion Wipes Active Student Enrollments and Earned Certificates Without Pre-Check or Notice
- **Category**: Irreversible Data Loss & Credential Integrity Violation
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L680-L702)
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx#L407-L423)
- **Description**:
  In `courseController.ts:deleteCourse`, lines 695–696 unconditionally execute:
  ```typescript
  Enrollment.deleteMany({ course: course._id }),
  Certificate.deleteMany({ course: course._id }),
  ```
  If an instructor deletes a course that students have paid for or completed, all active student enrollments, learning progress, and earned certificates are permanently deleted from the database. Furthermore, `MyCourses.tsx` displays a generic confirmation modal without checking or warning that active students are enrolled.
- **Reproduction Steps**:
  1. Student pays for a course, finishes it, and earns a certificate.
  2. Instructor clicks Delete on the course in `/instructor/courses`.
  3. Instructor clicks "Confirm" on the generic prompt.
  4. The course, student enrollments, and all earned completion certificates are irrevocably deleted.
- **Remediation**:
  - Reject course deletion if `Enrollment.exists({ course: course._id, status: { $in: ["active", "completed"] } })`, directing instructors to unpublish or archive the course instead.
  - Require administrator override for hard deletion, and preserve earned `Certificate` records indefinitely for credential verification.

---

## Action Plan & Verification Matrix

| Step | Item | Scope | Test Verification Method |
| :--- | :--- | :--- | :--- |
| 1 | AUDIT-01 | Fix rejection reset in `courseController.ts` & add resubmit UI in `EditCourse.tsx` / `MyCourses.tsx` | Reject course via admin, verify resubmit button appears, resubmit, verify pending badge increments. |
| 2 | AUDIT-02 | Allow enrolled students access in `courseController.ts:getCourseById` | Unpublish course to draft, verify enrolled student can still access `/learn/:id` and lesson content. |
| 3 | AUDIT-03 | Add course accessibility checks in `orderController.ts:checkout` | Attempt checkout with draft/disabled course ID; verify 400 rejection and cart pruning. |
| 4 | AUDIT-04 | Set `totalLessonsCount` on checkout enrollment creation & add fallback in progress | Complete all lessons of course; verify `completedAt`, certificate creation, and notification trigger. |
| 5 | AUDIT-05 | Invalidate `isApproved` on unpublish if approval required | Unpublish approved course, edit, attempt republish; verify it enters pending moderation queue. |
| 6 | AUDIT-06 & 07 | Fix routes `/courses?mine=true` in `Assignments.tsx` and `Coupons.tsx` | Load `/instructor/assignments` and `/instructor/coupons`; verify course dropdowns populate without errors. |
| 7 | AUDIT-08 | Handle `isActive: false` in `MyCourses.tsx` | Disable course via admin; verify instructor sees "Suspended by Admin" badge and disabled toggle. |
| 8 | AUDIT-09 | Refresh auth context on notification click / protected route check | Approve student as instructor; click notification; verify seamless navigation to `/instructor`. |
| 9 | AUDIT-10 | Compute coupon status considering `expiresAt` and `maxRedemptions` | View expired coupon in instructor and admin views; verify red "Expired" pill and disabled controls. |
| 10 | AUDIT-11 | Calculate progress percentage directly in `getInstructorStudents` | Student completes lessons; instructor checks `/instructor/students`; verify real percentage appears. |
| 11 | AUDIT-12 | Lock graded assignment modal and reject backend resubmission | View graded assignment as student; verify read-only view; verify backend rejects re-submit. |
| 12 | AUDIT-13 | Add application withdrawal and update routes for pending instructors | Apply as instructor; verify withdraw button; withdraw and re-apply. |
| 13 | AUDIT-14 | Prune cart items in `deleteCourse` | Delete course; inspect database; verify course ID pulled from all cart items. |
| 14 | AUDIT-15 | Allow instructors and admins to review courses they are enrolled in | Log in as instructor, enroll in peer course, post review; verify 201 Created. |
| 15 | AUDIT-16 | Add notification on role update & handle course cascading on demotion | Promote user in `/admin/users`; verify notification received by user. |
| 16 | AUDIT-17 | Prevent deletion of populated categories | Attempt to delete category with courses; verify validation warning. |
| 17 | AUDIT-18 | Clean up dead code & add navigation footer in `CreateCourse.tsx` Step 2 | Check curriculum builder bottom footer; verify clear action button to complete. |
| 18 | AUDIT-19 | Pass `isEnrolled` to `<CourseCard>` on `Home.tsx` | Enrolled student visits home page; verify "Continue Learning" button displays instead of "Add to Cart". |
| 19 | AUDIT-20 | Reject direct free enrollments on paid courses & route `EnrollButton` to checkout | Hit `POST /api/enrollments` with paid course ID; verify 402 rejection. Click `EnrollButton`; verify redirect to checkout. |
| 20 | AUDIT-21 | Block instructor self-purchase in `cartController:addToCart` and `orderController:checkout` | Instructor attempts adding own course to cart; verify 400 error: "Instructors cannot purchase their own courses." |
| 21 | AUDIT-22 | Correct notification link in `adminController.ts` & add `/instructor/dashboard` redirect | Admin approves instructor; click notification; verify clean navigation to `/instructor`. |
| 22 | AUDIT-23 | Fix route path in `InstructorPublicProfile.tsx` & respect approval settings in controller | Click instructor link on course details; verify 200 OK and profile loads with stats and course grid. |
| 23 | AUDIT-24 | Add `unarchiveCourse` route and UI restore control in `MyCourses.tsx` | Archive course, verify "Restore / Unarchive" action restores course to draft/published state. |
| 24 | AUDIT-25 | Add cascading deletion for Quizzes, Attempts, Assignments, and Submissions | Delete course with quiz and assignment; verify no orphaned docs remain in MongoDB. |
| 25 | AUDIT-26 | Reject checkout if student is already enrolled in cart courses | Add already-enrolled course to checkout; verify 400 error rejecting duplicate order. |
| 26 | AUDIT-27 | Call `onQuizPassed` in `LessonQuiz.tsx` on load when `latestAttempt?.passed` is true | Pass quiz, switch lessons, return; verify "Mark as Complete" button is enabled without re-taking. |
| 27 | AUDIT-28 | Preserve `correctAnswer` in `getQuiz` for instructors & add quiz removal action | Instructor re-opens quiz editor; verify correct radio answers remain selected and quiz can be saved or removed. |
| 28 | AUDIT-29 | Deactivate instructor courses upon user deactivation in `adminController.ts` | Admin deactivates instructor; verify instructor's courses are removed from marketplace catalog. |
| 29 | AUDIT-30 | Add null checks for deleted lessons in `NotesAndBookmarksPage.tsx` | Bookmark lesson, delete lesson via studio, open Study Hub; verify page renders gracefully without crashing. |
| 30 | AUDIT-31 | Align analytics revenue calculation with completed order earnings | Check analytics and earnings dashboards; verify consistent revenue reporting. |
| 31 | AUDIT-32 | Render instructor studio banner on `CourseDetailsPage.tsx` for course author | Instructor views own course; verify "Edit in Studio" banner appears instead of "Enroll Now / Add to Cart". |
| 32 | AUDIT-33 | Filter moderation queue query & disable active toggle on drafts | Create draft course; open `/admin/courses`; verify draft does not crowd queue and toggle is disabled. |
| 33 | AUDIT-34 | Add Preview Mode banner and replace purchase card on Course Details | Admin clicks "Preview" on pending course; verify sticky preview banner and no student purchase CTA. |
| 34 | AUDIT-35 | Add instructor payout cancel endpoint & UI button in `Earnings.tsx` | Request payout; click "Cancel Request"; verify funds return to balance and status becomes "Cancelled". |
| 35 | AUDIT-36 | Display archived/unpublished banner in `MyLearning` & notify enrolled students | Archive course; verify enrolled student sees "Archived" banner in viewer and receives notification. |
| 36 | AUDIT-37 | Synchronize `InstructorApplication`, audit log, & user notification on role change | Demote instructor in `/admin/users`; verify dossier updates, audit log records action, and user gets notification. |
| 37 | AUDIT-38 | Align wishlist role access across frontend & backend | Log in as instructor/admin, add to wishlist, toggle on course card; verify 200 OK without role toast. |
| 38 | AUDIT-39 | Add direct "Add to Cart" action button to `WishlistPage.tsx` | View wishlist; click "Add to Cart"; verify item moves to cart with toast confirmation. |
| 39 | AUDIT-40 | Add enrollment check & paywall gate to `LessonViewer.tsx` | Visit `/learn/:courseId` while unenrolled; verify informative paywall card and CTA to course page. |
| 40 | AUDIT-41 | Protect completed enrollments & certificates on curriculum additions | Complete course, add new lessons in studio; verify completed status preserved and certificate remains valid. |
| 41 | AUDIT-42 | Add publication check in `getCourseFAQs` and fix order index calculation | Create FAQs, delete middle FAQ, create new FAQ; verify unique sequential order indices. |
| 42 | AUDIT-43 | Dynamic origin for verify URL & auth check for "Back to Certificates" link | Open `/verify/:id` in incognito; verify clicking back navigates to public catalog, share link uses current origin. |
| 43 | AUDIT-44 | Cascade force-regeneration to progress records or guard against active enrollments | Attempt force-regenerate on course with active enrollments; verify validation warning or clean progress reset. |
| 44 | AUDIT-45 | Add status pills & draft guards to course selector in `Announcements.tsx` | Open `/instructor/announcements`; verify draft courses have clear badges and prevent unbroadcasted alerts. |
| 45 | AUDIT-46 | Deep-link tab routing with `?tab=` search params in `LessonViewer.tsx` | Click discussion reply notification; verify LessonViewer opens directly to Discussion tab. |
| 46 | AUDIT-47 | Cascade section deletion to lesson counts, prerequisites, quizzes, & enrollments | Delete section; verify sibling prerequisite cleared, `totalLessonsCount` synced, and dangling quizzes removed. |
| 47 | AUDIT-48 | Create `ensureNotInMaintenance` middleware for mutation routes & check in frontend | Enable maintenance mode; verify non-checkout writes (enrollments, progress, comments) return 503 for non-admins. |
| 48 | AUDIT-49 | Read `allowUserRegistration` in `Header.tsx` and hide/disable registration CTA & modal tab | Disable registration in settings; verify "Register" button hidden/disabled and AuthModal defaults to login with warning. |
| 49 | AUDIT-50 | Add lazy streak expiration check in `getStudentStreak` and `streakService.ts` | Set `lastActiveDate` > 1 day ago; query streak API; verify `currentStreak` returns 0 before lesson completion. |
| 50 | AUDIT-51 | Align `AuditLogs.tsx` action/target filters with backend constants, add pagination & audit missing deletes | Select `USER_STATUS_TOGGLED` in audit filter; verify results populate; verify pagination controls function. |
| 51 | AUDIT-52 | Add course existence check or `$unset` in `deleteCategory` and warn in `CategoryManagement.tsx` | Attempt to delete category with mapped courses; verify rejection or cleanup prompt, avoiding orphaned IDs. |
| 52 | AUDIT-53 | Add RFC 4180 CSV parsing and failed-rows modal review state in `BulkLessonUploadModal.tsx` | Upload CSV with commas in titles and 1 invalid row; verify titles parse correctly and failed rows are shown in modal. |
| 53 | AUDIT-54 | Dynamically render payout share in `FinancialReports.tsx` and format currency in payout alerts | Change currency to EUR and payout share to 70%; verify reports show 70% and payout alerts show € symbol. |
| 54 | AUDIT-55 | Add `loadingProgress` guard and prioritize `p.lastLessonId` before falling back to `lessons[0]` in `LessonViewer.tsx` | Complete 5 lessons of a course, return to My Learning, click "Continue Learning"; verify viewer opens directly to lesson 5 instead of lesson 1. |
| 55 | AUDIT-56 | Filter out instructor-owned courses in `cartController.ts:mergeCart` and reject in `orderController.ts:checkout` | Add own course to cart as guest, log in as instructor; verify course is pruned from cart with toast notification. |
| 56 | AUDIT-57 | Expose `isCapped` in `couponController.ts:validateCoupon` & add explanatory subsidy cap notice in `CartPage.tsx` | Apply 50% platform coupon on 20% commission system; verify clear banner indicates discount cap to avoid buyer confusion. |
| 57 | AUDIT-58 | Allow enrolled learners and instructors access to course reviews in `reviewController.ts` regardless of publication state | Unpublish course with active enrollments, log in as enrolled student; verify reviews endpoint succeeds and student review is accessible. |
| 58 | AUDIT-59 | Add `?tab=assignments` deep link to student notification in `assignmentController.ts:gradeSubmission` | Grade submission as instructor, click student notification; verify LessonViewer opens directly with the Assignments tab selected. |
| 59 | AUDIT-60 | Add sequential re-indexing on lesson item deletion & introduce reordering endpoint in `lessonItemController.ts` | Delete middle lesson item, create new item; verify distinct consecutive order numbers and test reorder API. |
| 60 | AUDIT-61 | Enforce strict forward state machine transitions for payouts in `adminController.ts` and lock UI in `AdminPayouts.tsx` | Mark payout completed; attempt status change to rejected; verify 400 rejection preventing double-disbursement. |
| 61 | AUDIT-62 | Restrict enrollment existence checks in `cartController.ts` to active/completed statuses & reset cancelled enrollments on checkout auto-enrollment | Unenroll from course, navigate to course details page, click "Add to Cart"; verify 200 OK and cart updates without 400 error. |
| 62 | AUDIT-63 | Unify progress mutation routes or enforce quiz passing gate and streaks in `enrollmentController.ts:updateProgress` | Attempt `PATCH /enrollments/:id/progress` on quiz-gated lesson without passing quiz; verify 400 rejection and verify streak updates on completion. |
| 63 | AUDIT-64 | Clean up or reset `LessonProgress` and revoke certificates on `cancelEnrollment`, default `getMyEnrollments` filter, and fix empty state in `MyCourses.tsx` | Complete course, unenroll; verify certificate verification reports revoked, `/my-courses` shows empty state instead of blank screen, re-enroll and verify progress resets. |
| 64 | AUDIT-65 | Differentiate course author badge (`comment.user?._id === courseInstructorId`) from generic instructor role in `LessonDiscussion.tsx` | Post comment as peer instructor enrolled in course; verify generic instructor badge is omitted or shown as peer, while course author shows "Course Instructor". |
| 65 | AUDIT-66 | Replace redundant "Update" button with clear completion toggle / reset control and guard final lesson completion modal in `LessonViewer.tsx` | Complete lesson, toggle incomplete; verify progress updates downward and final lesson does not trigger repeat completion modals. |
| 66 | AUDIT-67 | Pass `isPreview` in `EditCourse.tsx`, preserve preview items in `getCourseById`, & add preview player modal in `CourseStructure.tsx` | Create course with preview lesson; open as guest; verify preview badge and modal playback function without 403. |
| 67 | AUDIT-68 | Track `isLate` on `AssignmentSubmission`, validate `dueDate` in `submitAssignment`, & add "Late" badge in Gradebook | Submit assignment past due date; verify `isLate: true` in database and amber "Late" pill renders in Gradebook. |
| 68 | AUDIT-69 | Branch notification title and type for `resubmission_requested` in `assignmentController.ts:gradeSubmission` | Request resubmission on assignment; verify student receives warning notification ("Assignment Revision Requested") instead of green 0/100 success alert. |
| 69 | AUDIT-70 | Enforce `pointsEarned <= criterion.maxPoints` in `gradeSubmission` and bind `max` attribute in `Assignments.tsx` | Enter 99 points on a 20-point rubric item; verify UI prevents entry or backend returns 400 validation error. |
| 70 | [x] AUDIT-71 | Enforce `requireInstructorApproval` in `onboardingController.ts` and prevent direct self-promotion to instructor | Register new user, choose Instructor in onboarding; verify role remains student with pending status, preserving admin vetting gate. |
| 71 | AUDIT-72 | Align payload key `instructorFeedback` in `Assignments.tsx` and render feedback panel for `resubmission_requested` in `CourseAssignmentsTab.tsx` | Enter feedback in gradebook; verify feedback persists in database and is visible to students in both graded and resubmission-requested states. |
| 72 | AUDIT-73 | Check `user.instructorStatus !== 'pending'` before auto-opening application modal in `Profile.tsx` | Apply as instructor, navigate to `/profile?apply=instructor`; verify modal does not pop open and review status card is displayed. |
| 73 | AUDIT-74 | Update student enrollment notification target to `/instructor/students?courseId=...` in `enrollmentController.ts` & parse param in `StudentsEnrolled.tsx` | Student enrolls in course, click notification as instructor; verify navigation lands directly on filtered student roster without 404 error. |
| 74 | AUDIT-75 | Change populated field from `thumbnail` to `thumbnailUrl` in `orderController.ts:getOrderHistory` & `getOrderReceipt` | Purchase course with cover image, visit `/purchase-history`; verify course cover thumbnail loads properly on order item cards. |
| 75 | AUDIT-76 | Make `currentPassword` optional in `content.validator.ts:changePasswordSchema` & adapt `Profile.tsx` password form for OAuth users | Log in via Google OAuth, navigate to `/profile` Security tab; verify "Current Password" is not required and local password can be set successfully. |
| 76 | AUDIT-77 | Include `instructorApplication` in `updateUser` call within `Profile.tsx:fetchProfile` & declare type in `AuthContext.tsx` | Submit instructor application, reject as admin, student reopens profile and clicks "Reapply"; verify form pre-fills with prior submission. |
| 77 | AUDIT-78 | Bulk-deactivate or draft published courses on instructor demotion/deactivation in `adminController.ts` & add confirmation warning in `UserManagement.tsx` | Admin demotes instructor to student in User Management; verify instructor's published courses are suspended from catalog and search. |
| 78 | AUDIT-79 | Pass `instructorPayoutShare` from `SystemSettings` in `instructorEarningsController.ts` and replace hardcoded 80% copy in `EarningsAndPayouts.tsx` | Change revenue split to 75% in admin settings; verify instructor earnings header and table column display 75% take-home share. |
| 79 | AUDIT-80 | Add `?tab=discussion` to comment notification link in `commentController.ts` and parse tab param in `LessonViewer.tsx` | Student posts question in lesson, instructor clicks bell notification; verify player opens directly with Discussion tab active. |
| 80 | AUDIT-81 | Add `useEffect` on `cart` in `CartPage.tsx` to re-validate or clear `appliedCoupon` on cart item removal or upsell addition | Apply course-specific coupon, remove eligible course; verify discount resets cleanly without allowing invalid zero-dollar checkout failure. |
| 81 | AUDIT-82 | Dispatch instructor notification, enrollment email, and streak record on order checkout in `orderController.ts` | Purchase paid course via checkout; verify instructor notification received, confirmation email dispatched, and student streak recorded. |
| 82 | AUDIT-83 | Add active/completed status filter to `mergeCart` in `cartController.ts` | Cancel enrollment, add course as guest, log in; verify course remains in cart ready for repurchase. |
| 83 | AUDIT-84 | Include `category` in `getPublicCategories` query and match by ObjectId in `categoryController.ts` | Create course assigned to category without repeating category name; verify public category card displays correct count. |
| 84 | AUDIT-85 | Compute progress percentage and add server pagination to `getEnrollments` in `adminController.ts` & `EnrollmentList.tsx` | View `/admin/enrollments`; verify accurate student progress percentages and pagination controls. |
| 85 | AUDIT-86 | Send info notification to instructor on student unenrollment in `enrollmentController.ts:cancelEnrollment` | Cancel enrollment as student; verify course instructor receives "Student Left Course" notification. |
| 86 | AUDIT-87 | Record audit log and send notifications on instructor payout request in `instructorEarningsController.ts` | Request payout as instructor; verify confirmation notification in bell, audit log in admin console, and admin alert. |
| 87 | AUDIT-88 | Escape regex metacharacters and preserve `$and` compound query in `courseController.ts:getCourses` | Search for `C++` within a category; verify 200 OK without 500 crash and verify category filter is preserved. |
| 88 | AUDIT-89 | Require lessons before course publish in `courseController.ts` and add empty state to `LessonViewer.tsx` | Attempt to publish empty-lesson course; verify 400 rejection; open empty course; verify friendly empty state instead of blank screen crash. |
| 89 | AUDIT-90 | Call `onQuizPassed` on initial load in `LessonQuiz.tsx` and gate completion on quiz presence in `LessonViewer.tsx` | Pass quiz and reload lesson; verify "Mark as Complete" is immediately enabled; verify video lessons with quizzes properly lock completion until quiz passed. |
| 90 | AUDIT-91 | Add cancelled status badge in `StudentsEnrolled.tsx` and preserve inactive courses in student roster query | Cancel enrollment; verify instructor student roster displays "Cancelled" badge instead of misleading "In Progress". |
| 91 | AUDIT-92 | Standardize active enrollment counts and field naming between `getCourses` and `getCourseById` | Compare student count on catalog card and course details page; verify identical active student counts. |
| 92 | AUDIT-93 | Send urgent notification to instructor when admin disables course in `adminController.ts:updateCourseStatus` | Disable course as admin; verify instructor receives immediate alert explaining course suspension. |
| 93 | AUDIT-94 | Guard `deleteCourse` against courses with active enrollments and preserve certificates in `courseController.ts` | Attempt to delete course with active/completed students; verify 400 rejection advising archival instead. |


