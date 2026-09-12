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
  [x] AUDIT-98: Revoked Certificate Verification Security Bypass and Permanent Re-issuance Lockout
  [x] AUDIT-103: Asynchronous Gateway Checkout Auto-Enrollment Vulnerability
  [x] AUDIT-105: Google OAuth Suspended User Bypass Permits Inactive Accounts to Log In and Obtain Active Session
  [ ] AUDIT-110: Student Lesson Progress Auto-Restores Revoked Certificates Overriding Admin Disciplinary Revocation
  [ ] AUDIT-117: Cross-Instructor Course Coupon Exploitation & Unauthorized Revenue Deduction

P1 (High):
  [x] AUDIT-06: Phantom API Route `/courses/instructor` Breaks Assignments & Gradebook
  [x] AUDIT-07: Silent Route Failure `/instructor/courses` Clears Course Dropdown in Coupons
  [x] AUDIT-08: Admin Course Disabling Masks as "Live" with Active Toggle in Instructor Studio
  [x] AUDIT-09: Role Promotion Client-State Desync Bounces Approved Instructors to Homepage
  [x] AUDIT-10: Expired and Exhausted Coupons Render Active Green Badges and Pause Controls
  [x] AUDIT-22: Dead-End Route Desync on Approved Instructor Notification Link
  [x] AUDIT-23: Public Instructor Profile Route 404 Endpoint Mismatch
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
  [ ] AUDIT-95: Paginated Reviews Break User Review Editing (409 Conflict) and Rating Breakdown Distribution Math
  [ ] AUDIT-96: Admin and Instructor Review Moderation Void for Defamatory Content
  [ ] AUDIT-102: System Settings Singleton Race Condition and Missing Upsert Guard in Admin Settings
  [ ] AUDIT-106: Category Deletion Foreign Key Orphanage Leaves Dangling References, Skewed Filters, and Lacks Audit Logging
  [ ] AUDIT-107: Instructor Re-Activation Asymmetric Course Suspension Leaves Catalog Content Indefinitely Suspended
  [ ] AUDIT-111: Purchase History Hardcoded "Completed" Badges & Unchecked Viewer Access for Failed / Refunded Orders
  [ ] AUDIT-112: Bulk Instructor Review Nuclear Fallback Processes Entire Platform Pending Queue When Selection is Empty
  [ ] AUDIT-113: Student Unenroll Modal Misleading Progress Retention Promise Contradicts Permanent Deletion
  [ ] AUDIT-114: Missing Lesson Item Update Route & Controller Deadlocks Content Modification
  [ ] AUDIT-118: Cross-Instructor Student Submissions Leak & Data Privacy Breach via Unscoped Course Query
  [ ] AUDIT-119: LessonViewer Query Parameter Stripping Destroys Notification Deep-Linking Context
  [ ] AUDIT-122: Desynchronized Enrollment Completion Lifecycle on Curriculum Additions and Deletions

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
  [ ] AUDIT-97: Deep-Link Announcement Notifications Tab Context Lost on Viewer Navigation
  [ ] AUDIT-99: Course Details Page Redundant Dual Checkout CTAs & Free Course Carting Paradox
  [ ] AUDIT-100: Wishlist Multi-Role Conflict & Header Navigation Desynchronization
  [ ] AUDIT-101: Cart Upsell Strip Recommends Already-Enrolled Courses Causing 400 Errors
  [ ] AUDIT-104: Course FAQ Ordering Index Collision & Inability to Reorder on Instructor UI
  [ ] AUDIT-108: Instructor Payout Request Irrevocability Locks Balances & Lacks Admin Notification Dispatch
  [ ] AUDIT-109: Course Generator Incomplete Instructor Lifecycle Flags Cause Multi-Role State Desynchronization
  [ ] AUDIT-115: Admin Financial Reports Ledger Unconditionally Renders Emerald Badges for Failed and Refunded Transactions
  [ ] AUDIT-116: Hardcoded Dollar Currency Formatting in Course Catalog and Cart Promo Badges Bypasses System Currency
  [ ] AUDIT-120: Instructor Minimum Payout Threshold Desynchronization & Hardcoded Currency UI
  [ ] AUDIT-121: Instructor Self-Course Wishlisting Allowed Leading to Dead-End "Move to Cart" Rejections
  [ ] AUDIT-123: Course Schema Field Mismatch in Notes and Bookmarks User Feeds Discarding Thumbnails
  [ ] AUDIT-124: Unhandled Course Category Dissociation on Admin Category Deletion

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
- **Status**: Completed
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
- **Remediation & Resolution Summary**:
  - In `frontend/src/pages/InstructorPublicProfile.tsx:70`, aligned the endpoint to `api.get('/users/instructor/${instructorId}')` and wrapped avatar rendering in `resolveMediaUrl(instructor.avatar)`.
  - In `backend/src/routes/userRoutes.ts` and `backend/src/server.ts`, added alias route mappings for `/instructor/:instructorId`, `/instructor/:instructorId/public-profile`, `/instructors/:instructorId`, and `/instructors/:instructorId/public-profile` for backward compatibility across existing clients.
  - In `backend/src/controllers/user/userController.ts:getPublicInstructorProfile`, applied `getCourseApprovalFilter()` to respect the global `requireCourseApproval` system settings rather than hardcoding `isApproved: true`, scoped enrollment metrics to active/completed statuses, and deduplicated student counts via a distinct Set.

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

#### AUDIT-95: Paginated Reviews Break User Review Editing (409 Conflict) and Rating Breakdown Distribution Math
- **Category**: State Synchronization & Review Edit Lockout
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L262-L279,L281-L305)
  - [`backend/src/controllers/course/reviewController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/reviewController.ts#L66-L76,L125-L128)
- **Description**:
  In `CourseDetailsPage.tsx:262-279`, the UI calculates `ratingBreakdown` and identifies `myReview` strictly from the locally loaded `reviews` state:
  ```typescript
  const totalReviewsCount = reviews.length;
  // ...
  const myReview = reviews.find((r) => r.student._id === user?.id);
  ```
  However, `loadReviews` fetches paginated reviews (`/courses/:courseId/reviews?page=${reviewsPage}&limit=5`).
  This causes two critical breakdowns:
  1. **Distorted Rating Distribution**: Because `totalReviewsCount = reviews.length` caps at 5 (or the current page's slice), the percentage bars in the star breakdown represent only the 5 reviews displayed on the current page rather than the course's true cumulative rating distribution from `course.ratingDistribution` or aggregate counts.
  2. **Review Edit Lockout (409 Conflict)**: If an enrolled student has previously reviewed the course and their review is located on page 2 (or sorted beyond the top 5), `myReview` evaluates to `undefined`. The review form renders in "Write a Review" mode instead of "Edit Your Review". When the student submits the form, lines 284–294 dispatch `POST /courses/:courseId/reviews` instead of `PATCH /courses/:courseId/reviews/me`. The backend controller correctly enforces uniqueness (`Review.findOne({ course: courseId, student: req.user.id })`) and rejects the request with `409 Conflict: "You have already reviewed this course"`. The student is permanently locked out of editing their review unless they manually paginate to the page containing their review.
- **Reproduction Steps**:
  1. Enroll in a course that already has 6 or more reviews from other students.
  2. Post a 5-star review as Student A (placing it on page 2 of paginated reviews).
  3. Refresh the course details page (`CourseDetailsPage.tsx`); the first page displays reviews 1–5.
  4. Note that `myReview` is `undefined`, and the review section displays an empty "Write a Review" form.
  5. Enter updated review text and click "Submit Review".
  6. Observe an unhandled `409 Conflict` error toast (*"You have already reviewed this course"*), blocking the user from saving changes.
- **Remediation**:
  - Add a dedicated backend endpoint `GET /courses/:courseId/reviews/me` (or return `userReview` as part of the reviews payload or course details response) so `myReview` is always resolved regardless of pagination.
  - Compute `ratingBreakdown` using the aggregate rating metrics provided by `getCourseRatingSummary` rather than the length of the paginated review subset.

---

#### AUDIT-96: Admin and Instructor Review Moderation Void for Defamatory Content
- **Category**: Role Permission Void & Moderation Failure
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/reviewController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/reviewController.ts#L202-L227)
  - [`backend/src/routes/courseRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/courseRoutes.ts#L78-L80)
- **Description**:
  In `reviewController.ts:deleteCourseReview`, review deletion is strictly scoped to the student author:
  ```typescript
  const review = await Review.findOne({ course: courseId, student: req.user.id });
  ```
  Furthermore, `courseRoutes.ts:78-80` defines review deletion as:
  ```typescript
  router.delete("/:courseId/reviews/me", protect, authorize("student", "instructor"), deleteCourseReview);
  ```
  There is no administrative endpoint or instructor moderation capability to delete, hide, or report abusive, spam, discriminatory, or defamatory reviews. If a malicious user enrolls in a course, posts hate speech or spam links, and leaves the platform, neither the course instructor nor platform administrators have any mechanism in the UI or API to remove the offending content. This exposes the platform to legal, brand, and safety liabilities.
- **Reproduction Steps**:
  1. Student posts an abusive, vulgar, or spam review on Course X.
  2. Log in as the instructor of Course X or as a Platform Administrator.
  3. Navigate to the course reviews list or admin console.
  4. Observe no delete, hide, or moderate icon/button exists.
  5. Attempting to call `DELETE /courses/:courseId/reviews/:reviewId` returns 404 because no moderation endpoint exists.
- **Remediation**:
  - Implement `deleteReviewByModerator` in `reviewController.ts` allowing course instructors and platform administrators (`authorize("admin", "instructor")`) to delete or flag inappropriate reviews by `reviewId`.
  - Add review moderation actions (e.g. trash icon or "Moderate Review" modal) in the instructor reviews view and admin moderation console, logging an audit record in `adminController.ts`.

---

#### AUDIT-97: Deep-Link Announcement Notifications Tab Context Lost on Viewer Navigation
- **Category**: Deep Linking & Navigation Context Loss
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/announcementController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/announcementController.ts#L124)
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L105)
- **Description**:
  When an instructor publishes a new course announcement, `announcementController.ts:createAnnouncement` dispatches notification alerts to all enrolled students with a deep link:
  ```typescript
  link: `/learn/${courseId}?tab=announcements`
  ```
  However, in `LessonViewer.tsx:105`, the active viewer tab is initialized strictly with local state:
  ```typescript
  const [activeTab, setActiveTab] = useState<'lesson' | 'notes' | 'discussion' | 'announcements' | 'assignments'>('lesson');
  ```
  `LessonViewer.tsx` completely ignores `useSearchParams` or URL query parameters on initial render. When an enrolled student receives an announcement notification and clicks it, the router navigates to `/learn/:courseId?tab=announcements`. The player mounts and unconditionally displays the `'lesson'` video player tab. The student has no visual cue that an announcement was posted, causing frustration and requiring manual navigation to the Announcements sub-tab.
- **Reproduction Steps**:
  1. Instructor posts an announcement for Course A.
  2. Enrolled Student B sees the in-app notification: *"New Announcement: Course Welcome"*.
  3. Student B clicks the notification card.
  4. Browser navigates to `/learn/COURSE_A_ID?tab=announcements`.
  5. Observe that `LessonViewer.tsx` mounts with `activeTab === 'lesson'`, buffering the first video lecture instead of showing the announcement.
- **Remediation**:
  - In `LessonViewer.tsx`, read `useSearchParams()` on mount. If a valid `tab` query parameter (`'notes' | 'discussion' | 'announcements' | 'assignments'`) is present in the URL, initialize `activeTab` to that tab.
  - Add an effect to keep `activeTab` synchronized with URL changes so back/forward navigation functions smoothly.

---

#### [x] AUDIT-98: Revoked Certificate Verification Security Bypass and Permanent Re-issuance Lockout
- **Category**: Security Vulnerability & Credential Integrity Bypass
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Admin, Public Third Parties / Employers
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L358-L385)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L188-L237)
  - [`backend/src/controllers/certificate/certificateController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/certificate/certificateController.ts#L20-L120)
  - [`frontend/src/pages/VerifyCertificatePage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/VerifyCertificatePage.tsx#L16-L349)
  - [`frontend/src/pages/MyCertificatesPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/MyCertificatesPage.tsx#L12-L114)
- **Description**:
  When a student unenrolls or has their enrollment cancelled in `enrollmentController.ts:cancelEnrollment`, lines 421–424 mark any issued certificate as revoked:
  ```typescript
  await Certificate.findOneAndUpdate(
    { student: enrollment.student, course: enrollment.course },
    { $set: { revokedAt: new Date() } }
  );
  ```
  However, the certificate verification and re-issuance pipelines completely fail to respect this field:
  1. **Verification Security Bypass**: In `certificateController.ts:getCertificateById`, the query fetches `Certificate.findById(certificateId)` and returns `{ certificate }` with 200 OK without inspecting `revokedAt`. On the frontend, `VerifyCertificatePage.tsx:62-89` inspects only `certificate` existence and renders a green shield badge: *"Verified Educational Credential — Authenticity Confirmed"*. Third-party employers or background checkers inspecting a revoked certificate link are told the credential is valid.
  2. **My Certificates Phantoms**: In `certificateController.ts:getMyCertificates`, revoked certificates are returned in the student's credentials list without status indicators, allowing revoked certificates to be downloaded and shared.
  3. **Permanent Re-Issuance Lockout**: If a student subsequently re-enrolls in the course and legitimately completes 100% of the lessons, `claimCertificate` executes:
     ```typescript
     let certificate = await Certificate.findOne({ student: studentId, course: courseId });
     if (certificate) {
       return res.json({ message: "Certificate already issued", certificate });
     }
     ```
     `claimCertificate` returns the existing revoked certificate without clearing `revokedAt`. The student is permanently locked out of obtaining a valid, unrevoked completion certificate.
- **Reproduction Steps**:
  1. Student completes Course X and claims Certificate C.
  2. Student or Admin cancels the enrollment via `PATCH /enrollments/:id/cancel`. Database records `revokedAt = Date.now()`.
  3. Open `/certificates/verify/C` in an incognito window.
  4. Observe that the public verification page renders a green "Verified Educational Credential" banner, falsely verifying a revoked certificate.
  5. Student re-enrolls in Course X, completes all lessons, and clicks "Claim Certificate".
  6. Backend returns *"Certificate already issued"*, leaving `revokedAt` set and locking the student out of a verified credential forever.
- **Remediation & Resolution Summary**:
  - **Verification Status & Endpoint Security**: In `certificateController.ts:getCertificateById`, computed `isRevoked: Boolean(certificate.revokedAt)` and returned `{ certificate: { ...certificate, isRevoked }, isRevoked, revokedAt }`. In `getMyCertificates`, mapped each certificate to include `isRevoked: Boolean(cert.revokedAt)`.
  - **Public Verification UI Alerting**: In `VerifyCertificatePage.tsx`, added conditional rendering for revoked credentials: a prominent red alert banner (*"This certificate was revoked on [Date] and is no longer a valid credential"*), a red "Revoked Credential" badge instead of "Verified Credential", a diagonal "REVOKED" watermark across the credential frame, a red "Revoked Seal" at the footer, and automatic suppression of the "Share on LinkedIn" action.
  - **Student Portfolio Representation**: In `MyCertificatesPage.tsx`, added a "Revoked" ribbon tag on course thumbnails, replaced "Verified Completion" with "Revoked Credential", rendered "Revoked On [Date]", and adjusted CTA styling.
  - **Legitimate Re-Issuance Lifecycle**: In `certificateController.ts:claimCertificate`, `progressController.ts:updateLessonProgress`, and `enrollmentController.ts:updateProgress`, when an actively enrolled student completes 100% of course requirements, any existing certificate with `revokedAt` has its revocation cleared via MongoDB `$unset: { revokedAt: 1 }`, `issuedAt` updated to the completion date, and enrollment reference synchronized, successfully re-issuing a valid credential. Additionally guarded course completion demotion checks against revoked certificates.

---

#### AUDIT-99: Course Details Page Redundant Dual Checkout CTAs & Free Course Carting Paradox
- **Category**: Conflicting UI Indicators & E-Commerce Workflow Paradox
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Guest
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/pages/courses/CourseDetailsPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/courses/CourseDetailsPage.tsx#L841-L905)
  - [`frontend/src/features/enrollment/components/EnrollButton.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/enrollment/components/EnrollButton.tsx#L40-L60)
- **Description**:
  In `CourseDetailsPage.tsx:841-905`, the right-side sticky purchase card renders duplicate and conflicting action buttons:
  1. **Redundant Dual Checkout Buttons**: For paid courses, line 841 renders `<EnrollButton courseId={course._id} price={course.price} />`. When clicked, `EnrollButton.tsx:40-60` executes `addToCart(courseId)` and immediately triggers `navigate('/cart?step=payment')`. Directly beneath `EnrollButton`, lines 851–874 render a second primary button labeled *"Instant Checkout"*, which executes identical logic: `await addToCart(course._id)` followed by `navigate('/cart?step=payment')`. Users are presented with two stacked full-width primary buttons performing the exact same action.
  2. **Free Course Carting Paradox**: For free courses (`course.price === 0` or `!course.isPaid`), `EnrollButton` renders *"Enroll for Free"* (which invokes 1-click free enrollment via `POST /enrollments`). However, lines 875–905 concurrently render an *"Add to Cart"* button. If a student or guest clicks *"Add to Cart"* on a free course, the course is added to the shopping cart as a $0 item, pushing them into the e-commerce checkout pipeline and credit card form instead of granting immediate 1-click access.
- **Reproduction Steps**:
  1. Open a paid course in `CourseDetailsPage.tsx`.
  2. Observe two primary buttons stacked vertically: "Enroll Now for $XX" and "Instant Checkout". Both perform the same cart addition and redirect to payment.
  3. Open a free course (`price: 0`).
  4. Observe "Enroll for Free" button and a secondary "Add to Cart" button.
  5. Click "Add to Cart"; observe the free course placed into the shopping cart, routing the user to checkout instead of completing instant free enrollment.
- **Remediation**:
  - In `CourseDetailsPage.tsx`, cleanly separate free and paid actions:
    - For free courses: Render only the single 1-click *"Enroll for Free"* button; hide all cart and checkout buttons.
    - For paid courses: Standardize on an intuitive e-commerce pattern: primary *"Buy Now"* (instant checkout) and secondary *"Add to Cart"* button, removing duplicate redundant actions.

---

#### AUDIT-100: Wishlist Multi-Role Conflict & Header Navigation Desynchronization
- **Category**: Multi-Role Inconsistency & Cross-Role State Desynchronization
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin, Guest
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/wishlist/components/WishlistButton.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/wishlist/components/WishlistButton.tsx#L26,L49)
  - [`backend/src/routes/wishlistRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/wishlistRoutes.ts#L13-L18)
  - [`frontend/src/components/layout/Header.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/components/layout/Header.tsx#L198,L533)
  - [`frontend/src/features/wishlist/pages/WishlistPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/wishlist/pages/WishlistPage.tsx#L159,L163-L181)
- **Description**:
  The wishlist subsystem exhibits multiple cross-role and authorization discrepancies:
  1. **Header vs Button Role Conflict**: In `Header.tsx:198, 533`, the navigation bar displays the Wishlist icon link (`/wishlist`) for all authenticated users, including Instructors and Admins. However, when an instructor or admin browses courses and clicks the heart icon on any course card, `WishlistButton.tsx:49` abruptly blocks them with an error toast: *"Only students can maintain a wishlist"*.
  2. **Cart Page Role Bypass**: On `CartPage.tsx:156`, any logged-in user can click *"Move to Wishlist"*. Because `backend/src/routes/wishlistRoutes.ts` uses only `protect` without `authorize("student")`, the backend allows instructors and admins to create wishlist entries via the cart, while the course catalog button blocks them.
  3. **Guest 401 Error on `/wishlist`**: `/wishlist` is defined as a public route in `App.tsx:71`. When an unauthenticated visitor navigates to `/wishlist`, `loadWishlist` fires `GET /me/wishlist` without an auth token, throwing a raw 401 error toast (*"Failed to load wishlist"*) instead of displaying a friendly login prompt or empty state.
  4. **Hardcoded Currency**: In `WishlistPage.tsx:159`, prices are displayed with a hardcoded `$` sign instead of utilizing `useCurrency().formatPrice()`.
- **Reproduction Steps**:
  1. Log in as an Instructor or Admin.
  2. In the header navigation, notice the Wishlist heart icon is visible and clickable.
  3. Navigate to `/courses` and click the Wishlist heart button on any course.
  4. Observe error toast: *"Only students can maintain a wishlist"*.
  5. Open an incognito tab and navigate directly to `/wishlist`; observe unhandled 401 error toast.
- **Remediation**:
  - In `Header.tsx`, either show the Wishlist link only for `user.role === 'student'`, or allow instructors/admins to maintain a learning wishlist for their own professional development.
  - Standardize `WishlistButton.tsx` and `wishlistRoutes.ts` on the same permission rules.
  - In `WishlistPage.tsx`, if the user is unauthenticated, show an attractive sign-in prompt instead of throwing an API error, and use `useCurrency()` for price formatting.

---

#### AUDIT-101: Cart Upsell Strip Recommends Already-Enrolled Courses Causing 400 Errors
- **Category**: State Synchronization & Defective Upsell Flow
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/CartPage.tsx#L104-L114)
  - [`backend/src/controllers/cart/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cart/cartController.ts#L175)
- **Description**:
  In `CartPage.tsx:104-114`, the shopping cart displays a "Recommended Courses to add to your order" upsell strip. The component fetches courses via `GET /courses?limit=4` and filters out courses already in the current cart:
  ```typescript
  const inCartIds = new Set(cart.items.map((i) => i.course._id));
  setRecommendedCourses(recRes.data.courses.filter((c) => !inCartIds.has(c._id)).slice(0, 3));
  ```
  However, it completely fails to filter out courses that the student has already purchased and enrolled in.
  When a student has enrolled in Course A, and Course A appears in the cart's recommendation strip:
  1. Course A displays an active "Add to Cart" button.
  2. When clicked, `addToCart(courseId)` sends `POST /cart/items`.
  3. In `cartController.ts:175`, the backend checks `Enrollment.findOne({ student: req.user.id, course: courseId, status: { $in: ["active", "completed"] } })` and returns `400 Bad Request: "You are already enrolled in this course."`.
  4. The student receives an unexpected red error toast on what appeared to be an endorsed recommendation.
- **Reproduction Steps**:
  1. Enroll in Course A as Student 1.
  2. Add Course B to cart and navigate to `/cart`.
  3. Observe Course A displayed in the "Frequently Bought Together / Recommended" strip with an "Add to Cart" button.
  4. Click "Add to Cart" on Course A.
  5. Observe error toast: *"You are already enrolled in this course."*.
- **Remediation**:
  - In `CartPage.tsx`, fetch or cross-reference the student's active enrollments (`useEnrollments` or `/me/enrollments`) and filter out already-enrolled course IDs from `recommendedCourses`.
  - On the recommended course card, if the student is already enrolled, replace "Add to Cart" with an "Enrolled" badge linking to `/learn/:courseId`.

---

#### AUDIT-102: System Settings Singleton Race Condition and Missing Upsert Guard in Admin Settings
- **Category**: Concurrency Race Condition & Data Corruption
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L670-L750)
  - [`backend/src/models/SystemSettings.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/SystemSettings.ts)
- **Description**:
  Platform system settings (such as `platformCommissionPercentage`, `requireCourseApproval`, `autoApproveInstructors`, and `maintenanceMode`) are stored in a singleton document managed by `adminController.ts:getSystemSettings` and `updateSystemSettings`.
  In `updateSystemSettings`:
  ```typescript
  let settings = await SystemSettings.findOne({ isSingleton: true });
  if (!settings) {
    settings = new SystemSettings({ isSingleton: true, ...req.body });
  } else {
    Object.assign(settings, req.body);
  }
  await settings.save();
  ```
  This non-atomic check-then-insert pattern causes two major race condition failures:
  1. **Duplicate Singleton Documents**: If multiple administrators save settings or if administrative APIs are hit concurrently during server initialization, concurrent `findOne` calls return `null` and create multiple documents with `isSingleton: true`. Subsequent reads by different controllers (`courseController`, `instructorEarningsController`, `orderController`) may read different conflicting documents.
  2. **Missing Unique Index**: The `SystemSettings` schema lacks a unique compound index on `{ isSingleton: 1 }`.
  3. **Silent Reset**: If `getSystemSettings` is called before settings are initialized, it returns default fallback values that are not persisted, causing other controllers querying `SystemSettings.findOne({ isSingleton: true })` to encounter `null` and default inconsistently.
- **Reproduction Steps**:
  1. Drop or start with a fresh `SystemSettings` collection.
  2. Concurrently execute two `PUT /admin/settings` requests (e.g. updating commission to 15% and toggling course approval).
  3. Inspect MongoDB `systemsettings` collection; observe two documents created.
  4. Instructor earnings calculation reads document A while admin console reads document B, desynchronizing platform commission calculations.
- **Remediation**:
  - In `backend/src/models/SystemSettings.ts`, add a unique index `{ isSingleton: 1 }` with `{ unique: true }`.
  - In `adminController.ts:updateSystemSettings`, use atomic `findOneAndUpdate({ isSingleton: true }, { $set: updateFields }, { upsert: true, new: true, setDefaultsOnInsert: true })`.

---

#### [x] AUDIT-103: Asynchronous Gateway Checkout Auto-Enrollment Vulnerability
- **Category**: Financial Invariant Violation & Unauthorized Course Access
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L320-L370)
  - [`backend/src/services/paymentService.ts`](file:///c:/Users/user/projects/skillkart/backend/src/services/paymentService.ts#L70-L85)
  - [`backend/src/models/Order.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Order.ts)
  - [`backend/src/routes/orderRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/orderRoutes.ts)
  - [`frontend/src/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/CartPage.tsx)
  - [`frontend/src/pages/PurchaseHistoryPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/PurchaseHistoryPage.tsx)
- **Description**:
  In `orderController.ts:checkout`, when a student places an order through the payment gateway simulator or an external pluggable gateway, lines 356–370 immediately create active student enrollments:
  ```typescript
  // Create or reactivate enrollments
  for (const item of cart.items) {
    // ...
    await Enrollment.create({
      student: req.user.id,
      course: item.course._id,
      status: "active",
      enrolledAt: new Date(),
      totalLessonsCount,
    });
  }
  ```
  However, this auto-enrollment logic executes **unconditionally**, without verifying that `order.paymentStatus === "paid"` or `"completed"`.
  When integrating real payment gateways (e.g. Stripe 3D Secure, Razorpay webhooks, or PayPal) where the initial checkout response returns `{ paymentStatus: "pending" }` awaiting customer two-factor verification or asynchronous bank clearance:
  1. The student is instantly granted `status: "active"` lifetime course enrollment.
  2. If the payment gateway subsequently fails, expires, or is declined by the bank, the student retains full course access, video streaming, quizzes, and certificate generation privileges.
  3. Neither the order controller nor payment webhook cancels or revokes enrollments created on pending orders.
- **Reproduction Steps**:
  1. Place an order where payment provider returns `paymentStatus: "pending"` (or simulated failure).
  2. Inspect the database; observe order status is `"pending"`.
  3. Check student enrollments: observe `Enrollment.status === "active"` created immediately.
  4. Student opens `/learn/:courseId` and completes the course without funds ever having cleared.
- **Remediation**:
  - In `orderController.ts:checkout`, guarded enrollment creation, coupon redemption counting, and completion timestamp strictly behind `isConfirmedPayment` (`paymentStatus === "completed"` or `"paid"`).
  - For pending orders (`paymentStatus: "pending"`), deferred enrollment creation, left `completedAt` unset, and dispatched an "Order Placed — Payment Pending" notification to the student.
  - Implemented `activateOrderEnrollments(order: IOrder)` helper with idempotent activation, lesson calculation, and single-redemption coupon increments.
  - Registered `handlePaymentWebhook` at `/api/orders/webhook` and `/api/orders/payment-webhook` supporting standard gateway events (`payment_intent.succeeded`, `checkout.session.completed`, failure/cancellation), activating enrollments on payment clearance and revoking tentative access on failure.
  - Updated `CartPage.tsx` confirmation view with dual-mode banner (green "Payment Confirmed • Enrolled" vs amber "Payment Pending • Awaiting Clearance" with delayed activation explanation).
  - Updated `PurchaseHistoryPage.tsx` with dynamic status pills (`Completed`, `Pending Clearance`, `Failed`, `Refunded`), conditional course access gating (`[Open]` link strictly enabled on confirmed payment, `[Pending Clearance]` indicator when pending), and dynamic receipt invoice status.

---

#### AUDIT-104: Course FAQ Ordering Index Collision & Inability to Reorder on Instructor UI
- **Category**: Instructor Content Management & State Sorting Collision
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/instructor/components/CourseFAQEditor.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/components/CourseFAQEditor.tsx#L1-L280)
  - [`backend/src/controllers/course/faqController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/faqController.ts#L65-L75)
- **Description**:
  In `faqController.ts:getCourseFAQs`, course FAQs are fetched with `.sort({ order: 1, createdAt: 1 })`.
  When an instructor creates a new FAQ in `CourseFAQEditor.tsx:51-74`, the frontend automatically sends `order: faqs.length + 1`.
  However, the editor has two structural flaws:
  1. **Zero Reordering Controls**: `CourseFAQEditor.tsx` provides no move up/down buttons, drag-and-drop handles, or numeric order inputs. Once an FAQ is created, its relative order position is permanently fixed. If an instructor wants to place an important new FAQ at the top of the course page, they must delete all existing FAQs and re-type them from scratch.
  2. **Deletion Index Gaps and Duplicate Keys**: When an intermediate FAQ is deleted (`handleDeleteFAQ`), subsequent FAQs retain their original `order` values. Creating new FAQs after deletions can result in duplicate `order` indices or broken sequencing, causing unpredictable sorting on the public course details accordion.
- **Reproduction Steps**:
  1. As an instructor, add 3 FAQs: FAQ 1 ("Prerequisites"), FAQ 2 ("Hardware"), FAQ 3 ("Refunds").
  2. Attempt to move FAQ 3 to the top. Notice there are no reorder controls.
  3. Delete FAQ 2 ("Hardware"). Remaining FAQs have orders 1 and 3.
  4. Add a new FAQ ("Certification"); it receives `order: 3` (`faqs.length + 1`), colliding with the existing order 3.
  5. The public course page renders FAQs in erratic sequence depending on MongoDB ObjectId sorting.
- **Remediation**:
  - Add "Move Up" (↑) and "Move Down" (↓) controls to `CourseFAQEditor.tsx`.
  - Add a `reorderFAQs` endpoint in `faqController.ts` allowing instructors to update FAQ orders atomically in batch, maintaining clean sequential order indices.

---

#### [x] AUDIT-105: Google OAuth Suspended User Bypass Permits Inactive Accounts to Log In and Obtain Active Session
- **Category**: Authentication Security & Account Lifecycle Invariant Violation
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Admin, Student, Instructor, Public
- **Status**: Completed
- **Affected Files**:
  - [`backend/src/controllers/auth/googleAuthController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/googleAuthController.ts#L22-L55)
  - [`backend/src/controllers/auth/authController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/auth/authController.ts#L115-L117)
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L110-L130)
  - [`frontend/src/features/auth/AuthModals.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/auth/AuthModals.tsx#L74-L86)
  - [`frontend/src/lib/api.ts`](file:///c:/Users/user/projects/skillkart/frontend/src/lib/api.ts#L20-L28)
- **Description**:
  In `adminController.ts:toggleUserStatus`, platform administrators have the authority to suspend fraudulent, abusive, or non-compliant user accounts by toggling `user.isActive = false`.
  In standard email/password authentication (`authController.ts:login`), the controller strictly verifies user activation status:
  ```typescript
  if (user.isActive === false) {
    return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
  }
  ```
  However, in Google OAuth authentication (`googleAuthController.ts:googleLogin`), this critical security gate was completely missing.
  When an existing user clicks "Sign in with Google" or completes the OAuth callback (`POST /api/auth/google`), lines 25–46 looked up the user by email, created or fetched the user document, and immediately issued a fresh 7-day JWT without verifying activation status.
  At no point did `googleAuthController.ts` verify whether `user.isActive === false`.
  As a consequence, any suspended student or banned instructor could effortlessly bypass an administrative ban simply by authenticating through Google OAuth, re-entering the platform with a fully valid JWT and unrestricted API privileges.
- **Reproduction Steps**:
  1. Log in as Admin and navigate to `/admin/users`.
  2. Locate an active user (e.g. `student@example.com` who has linked Google OAuth) and click "Deactivate". The user record in MongoDB now has `isActive: false`.
  3. Attempt to log in using standard credentials (`POST /api/auth/login`); verify the system returns `403 Forbidden: "Your account has been deactivated. Please contact support."`.
  4. On the frontend login modal, click "Sign in with Google" and authenticate using `student@example.com`.
  5. Observe that previously the OAuth API returned `200 OK` with a valid JWT, regaining complete platform access.
- **Remediation & Resolution Summary**:
  - In `googleAuthController.ts:googleLogin`, expanded user lookup to query both `{ $or: [{ googleId: sub }, { email }] }` and explicitly inspected `user.isActive` immediately after retrieving an existing user document:
    ```typescript
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact support.",
      });
    }
    ```
  - In `authController.ts:login`, synchronized the 403 error message with the exact wording `"Your account has been deactivated. Please contact support."` for parity across authentication methods.
  - In `AuthModals.tsx`, updated `useGoogleLogin` catch handler to extract and toast specific API error messages via `getErrorMessage(err, 'Google authentication failed')`, ensuring deactivated users clearly see the suspension notice instead of a generic failure toast.
  - In `frontend/src/lib/api.ts`, registered `/auth/google` in the auth endpoints bypass list so 401 response codes on invalid OAuth tokens do not inadvertently purge prior session storage or fire spurious `auth:expired` events.

---

#### AUDIT-106: Category Deletion Foreign Key Orphanage Leaves Dangling References, Skewed Filters, and Lacks Audit Logging
- **Category**: Admin Catalog Integrity & Cascading Lifecycle Inconsistency
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/category/categoryController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/category/categoryController.ts#L188-L207)
  - [`frontend/src/features/admin/pages/CategoryManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CategoryManagement.tsx#L175-L188)
  - [`backend/src/controllers/course/courseController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/courseController.ts#L159-L184,L497-L505)
- **Description**:
  In `categoryController.ts:deleteCategory`, administrators can delete a category via `DELETE /api/categories/:categoryId`.
  The controller executes `Category.findByIdAndDelete(categoryId)` without checking if any courses are currently assigned to that category (`Course.countDocuments({ category: categoryId })`).
  This causes three critical system defects:
  1. **Dangling Foreign Keys & Catalog Invisibility**: Existing courses retain the deleted category's `ObjectId` in `course.category`. When learners filter the course catalog by category slug or category ID (`courseController.ts:getCourses`), the deleted category is no longer found in `Category.findById/findOne`, causing courses tagged with it to become completely unreachable via category browsing and category discovery chips.
  2. **Zero Dependency Warning in Admin UI**: In `CategoryManagement.tsx:175-188`, the delete handler triggers a generic browser prompt: `window.confirm("Are you sure you want to delete this category?")`. It provides no visibility into how many courses are attached to the category, nor does it warn the administrator that existing courses will be orphaned.
  3. **Complete Lack of Audit Logging**: Unlike user management, course moderation, and system settings which invoke `recordAuditLog`, `categoryController.ts` lacks any audit trail calls. Deleting or modifying categories leaves no record in the admin audit log, making accidental or malicious category deletions untraceable.
- **Reproduction Steps**:
  1. As Admin, create a category named "Cloud Computing" and assign 3 published courses to it.
  2. Open `/admin/categories` and click "Delete" on "Cloud Computing". Confirm the browser prompt.
  3. Deletion succeeds instantly.
  4. Inspect MongoDB `courses` collection; observe the 3 courses still have `category: ObjectId("...")` referencing the now-deleted category document.
  5. Navigate to `/courses` and observe the courses have `category: null` populated, breaking category badges on course cards.
  6. Navigate to `/admin/audit-logs`; verify zero audit events exist for the deleted category.
- **Remediation**:
  - In `categoryController.ts:deleteCategory`:
    - Count assigned courses: `const courseCount = await Course.countDocuments({ category: categoryId });`.
    - If `courseCount > 0`, return `400 Bad Request` with `{ message: "Cannot delete category with attached courses. Please reassign or uncategorize existing courses first.", courseCount }`, OR optionally provide a cascade option that executes `await Course.updateMany({ category: categoryId }, { $unset: { category: 1 } })`.
    - Record the administrative action with `recordAuditLog({ adminId, action: "CATEGORY_DELETED", targetType: "category", targetId: categoryId, targetName: category.name, details: { courseCount } })`.
  - In `CategoryManagement.tsx`, replace `window.confirm` with a structured confirmation modal that displays the number of attached courses.

---

#### AUDIT-107: Instructor Re-Activation Asymmetric Course Suspension Leaves Catalog Content Indefinitely Suspended
- **Category**: Admin / Instructor Lifecycle Asymmetry & Catalog Visibility Lockout
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L110-L135)
  - [`frontend/src/features/admin/pages/UserManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/UserManagement.tsx#L65-L85)
  - [`frontend/src/features/instructor/pages/MyCourses.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/MyCourses.tsx#L128-L145)
- **Description**:
  In `adminController.ts:toggleUserStatus`, when an administrator deactivates an instructor account (`newStatus === false`), lines 116–118 automatically deactivate all courses authored by that instructor:
  ```typescript
  if (!newStatus && user.role === "instructor") {
    await Course.updateMany({ instructor: user._id }, { isActive: false });
  }
  ```
  This cascading suspension safeguards the marketplace while the instructor's account is under investigation.
  However, when the administrator resolves the investigation or billing hold and re-activates the instructor (`newStatus === true`), the system exhibits a severe lifecycle asymmetry:
  1. The user account is re-enabled (`user.isActive = true`), but **all of the instructor's courses remain `isActive: false` indefinitely**.
  2. The administrator is given no prompt, checkbox, or option to reactivate the instructor's courses upon re-enabling their account.
  3. The instructor logs into their studio (`/instructor/courses`) and finds all their published courses tagged as "Suspended by Admin", with the active/inactive toggle switch disabled.
  4. Because instructors have no permission to modify `course.isActive` (only admins can toggle `isActive` via `/admin/courses`), the instructor cannot self-restore their catalog visibility.
  5. The instructor's content remains deadlocked in suspended status unless an admin manually visits `/admin/courses` and toggles every individual course back on one by one.
- **Reproduction Steps**:
  1. As Admin, deactivate Instructor Jane Doe via `/admin/users`. All Jane Doe's published courses are marked `isActive: false`.
  2. Jane Doe's courses vanish from the marketplace catalog and search results.
  3. As Admin, re-activate Jane Doe in `/admin/users` (`isActive: true`).
  4. Jane Doe logs in and navigates to `/instructor/courses`.
  5. Observe that every course displays "Suspended by Admin", and the publish/unpublish toggle is locked.
  6. Public students searching for Jane Doe's courses still find zero results despite Jane Doe's account being active and verified.
- **Remediation**:
  - In `adminController.ts:toggleUserStatus`, when `newStatus === true` and `user.role === "instructor"`:
    - Check if the admin included a query flag or body option `reactivateCourses: true`.
    - If `reactivateCourses` is true, restore `isActive: true` on all courses owned by the instructor that were previously published.
    - Return `suspendedCoursesCount` in the response payload so the admin frontend can inform the admin.
  - In `UserManagement.tsx`, when enabling an instructor who has suspended courses, prompt the admin: *"This instructor has X suspended courses. Would you like to reactivate their published courses as well?"*.
  - Send an in-app notification to the instructor notifying them of their account restoration and clarifying the visibility status of their courses.

---

#### AUDIT-108: Instructor Payout Request Irrevocability Locks Balances & Lacks Admin Notification Dispatch
- **Category**: Instructor Finance UX & Asynchronous Lifecycle Dead-End
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L328-L412)
  - [`backend/src/models/Payout.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Payout.ts#L3-L20)
  - [`frontend/src/features/instructor/pages/EarningsAndPayouts.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EarningsAndPayouts.tsx#L280-L340)
  - [`frontend/src/features/admin/pages/AdminPayouts.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/AdminPayouts.tsx#L1-L150)
- **Description**:
  In `instructorEarningsController.ts:requestInstructorPayout`, instructors submit withdrawal requests against their earned balance. The endpoint deducts the requested payout amount from the instructor's earnings and records a `Payout` document with `status: "pending"`.
  However, this withdrawal pipeline suffers from two structural gaps:
  1. **No Instructor Self-Cancellation Mechanism**: The `PayoutStatus` enum in `Payout.ts` only defines `["pending", "processing", "completed", "rejected"]`. There is no `"cancelled"` status, nor is there a route for instructors to cancel a pending payout. If an instructor requests a payout with incorrect bank/PayPal account details or realizes they need to delay the withdrawal for tax accounting, their money is frozen in "pending" status indefinitely. They cannot recall the request or modify payout destination details without administrative manual intervention.
  2. **Silent Submission Void of Admin Notification**: When an instructor submits a withdrawal request, no notification, alert, or system event is dispatched to platform administrators. Administrators are only aware of pending payouts if they proactively navigate to `/admin/payouts`. Without notification alerts, instructor withdrawal requests can sit unattended for weeks, degrading instructor satisfaction and trust.
- **Reproduction Steps**:
  1. As an instructor, navigate to `/instructor/earnings` with an available balance of $1,000.
  2. Request a withdrawal of $400. Available balance immediately drops to $600, and a payout row with status "Pending" appears in the payout history table.
  3. Realizing incorrect bank transfer information was entered, attempt to cancel or retract the payout. Notice there is no "Cancel Request" action in `EarningsAndPayouts.tsx`.
  4. Log in as an administrator; check the notification bell. Notice no notification was received alerting administrators to the new $400 payout request.
- **Remediation**:
  - In `backend/src/models/Payout.ts`, update `PayoutStatus` to include `"cancelled"`.
  - In `instructorEarningsController.ts`, implement `cancelPayoutRequest(req, res)`:
    - Verify that the payout belongs to the requesting instructor and is currently in `"pending"` status.
    - Transition status to `"cancelled"`.
    - Refund the payout amount back into the instructor's available balance.
    - Notify the instructor and record an audit log event.
  - In `requestInstructorPayout`, dispatch a notification to all platform administrators (`User.find({ role: "admin" })`) linking to `/admin/payouts`.
  - In `EarningsAndPayouts.tsx`, display a "Cancel Request" button on rows where `status === "pending"`.

---

#### AUDIT-109: Course Generator Incomplete Instructor Lifecycle Flags Cause Multi-Role State Desynchronization
- **Category**: Multi-Role State Synchronization & Demo Data Integrity
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/services/courseGeneratorService.ts`](file:///c:/Users/user/projects/skillkart/backend/src/services/courseGeneratorService.ts#L1117-L1145)
  - [`frontend/src/features/admin/pages/UserManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/UserManagement.tsx#L175-L210)
  - [`backend/src/models/User.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/User.ts#L66-L74)
- **Description**:
  The demo data generator (`courseGeneratorService.ts:getOrCreateInstructor`) automatically creates instructor accounts when seeding the platform with demo courses:
  ```typescript
  let instructor = await User.findOne({ email: input.email });
  if (!instructor) {
    instructor = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: "instructor",
      avatarUrl: input.avatarUrl,
      headline: input.headline,
      bio: input.bio,
    });
    return { instructor, created: true };
  }
  ```
  This implementation causes two severe state synchronization defects:
  1. **Unset Schema Approval Flags**: The `User` Mongoose schema defines `isInstructorApproved: { type: Boolean, default: false }` and `instructorStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" }`. Because `getOrCreateInstructor` only sets `role: "instructor"` without explicitly setting `isInstructorApproved` and `instructorStatus`, the newly created instructor has `role: "instructor"`, but `isInstructorApproved: false` and `instructorStatus: "none"`. When an administrator views `/admin/users`, the instructor appears with conflicting badges, and filtering by `instructorStatus === "approved"` completely excludes them.
  2. **Existing Student Downgrade Trap**: If an existing user account has the same email as one of the seed instructors (e.g. `instructor1@skillkart.com`), lines 1133–1145 update their bio and headline, but **leave `instructor.role` as `"student"`**. The generator then creates courses authored by this user (`course.instructor = instructor._id`). However, because the user's role remains `"student"`, the user cannot access the `/instructor` portal or gradebook (`ProtectedRoute` blocks them with 403 Forbidden). A student is now the recorded author of published courses without having instructor privileges.
- **Reproduction Steps**:
  1. Run the demo course generator via `/admin/courses` ("Regenerate Demo Data").
  2. Navigate to `/admin/users` and inspect the newly created instructors.
  3. Notice that their Role is displayed as "Instructor", but their Approval Status is "None" or "Unapproved" due to `isInstructorApproved: false`.
  4. Register a student user with email `demo.instructor@skillkart.com`, then run the generator with that email.
  5. The generator assigns 5 courses to `demo.instructor@skillkart.com`, but the user cannot log in and access `/instructor/courses` because their role is still `"student"`.
- **Remediation**:
  - In `courseGeneratorService.ts:getOrCreateInstructor`, explicitly pass `isInstructorApproved: true` and `instructorStatus: "approved"` when creating instructors.
  - When an existing user matches the email, ensure `instructor.role = "instructor"`, `instructor.isInstructorApproved = true`, and `instructor.instructorStatus = "approved"`, and save before generating courses.

---

#### AUDIT-110: Student Lesson Progress Auto-Restores Revoked Certificates Overriding Admin Disciplinary Revocation
- **Category**: Academic Integrity & Security Lifecycle Vulnerability
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Admin, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L188-L215)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L358-L375)
  - [`backend/src/models/Certificate.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Certificate.ts#L10,L27)
  - [`frontend/src/pages/VerifyCertificatePage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/VerifyCertificatePage.tsx#L40-L106)
- **Description**:
  The SkillKart credentialing engine supports certificate revocation via `Certificate.revokedAt` (used when an enrollment is cancelled or when an administrator revokes a certificate for academic integrity violations, fraud, or chargebacks).
  However, in `progressController.ts:updateLessonProgress`, when a student completes all lessons (or updates progress on a completed course):
  ```typescript
  let certDoc = await Certificate.findOne({ student: req.user.id, course: course._id });
  if (certDoc) {
    if (certDoc.revokedAt) {
      await Certificate.updateOne(
        { _id: certDoc._id },
        {
          $unset: { revokedAt: 1 },
          $set: {
            issuedAt: enrollment.completedAt,
            enrollment: enrollment._id,
          },
        }
      );
      certDoc.revokedAt = undefined;
    }
  }
  ```
  This un-revocation routine executes **completely unconditionally**.
  If an administrator discovers that a student engaged in plagiarism or fraudulent quiz automation and revokes the student's certificate:
  1. The administrator marks `certDoc.revokedAt = new Date()` (or issues an administrative revocation).
  2. The student visits `/learn/:courseId/:lessonId`.
  3. The student simply clicks "Update" on any lesson (or toggles a lesson progress).
  4. `updateLessonProgress` detects `isFullyComplete` and unconditionally executes `$unset: { revokedAt: 1 }`!
  5. The student has effectively un-revoked their own certificate with a single button click, completely nullifying administrative disciplinary actions and compromising platform credibility.
- **Reproduction Steps**:
  1. Student completes a course and receives a certificate.
  2. Administrator or integrity committee revokes the certificate due to plagiarism (`revokedAt = new Date()`).
  3. Verify public verification page `/verify/:id` correctly displays the certificate as revoked.
  4. Student opens `/learn/:courseId/lesson-1` in `LessonViewer.tsx` and clicks "Update" on the lesson header.
  5. Refresh `/verify/:id`; observe the certificate is once again active, verified, and displays a green shield with authenticity confirmed.
- **Remediation**:
  - Add a revocation reason or source field to `CertificateSchema` (e.g. `revocationReason: string`, `isDisciplinaryRevocation: boolean`, `revokedBy?: ObjectId`).
  - In `progressController.ts:updateLessonProgress`, do NOT clear `revokedAt` if the certificate was revoked administratively or for disciplinary reasons. Only allow re-issuance if the revocation was specifically due to an enrollment cancellation that has been legitimate re-enrolled and re-approved.
  - Require an explicit administrative action to reinstate an administratively revoked credential.

---

#### AUDIT-111: Purchase History Hardcoded "Completed" Badges & Unchecked Viewer Access for Failed / Refunded Orders
- **Category**: Misleading Status Badges & Broken Cross-Role Payment Access
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Admin
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/pages/PurchaseHistoryPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/pages/PurchaseHistoryPage.tsx#L189-L195,L212-L218,L279)
  - [`backend/src/models/Order.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Order.ts#L15,L138-L143)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L393-L410)
- **Description**:
  The `Order` model defines four distinct payment states: `"completed" | "pending" | "failed" | "refunded"`.
  However, in `PurchaseHistoryPage.tsx#L212-218`, the status table column completely ignores `order.paymentStatus` and hardcodes an emerald checkmark and text:
  ```tsx
  <td className="px-5 py-4 whitespace-nowrap">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
      <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
      <span>Completed</span>
    </span>
  </td>
  ```
  Furthermore:
  1. In the printable invoice modal (`PurchaseHistoryPage.tsx#L279`), it hardcodes `Status: <span className="font-bold text-emerald-600">Paid & Enrolled</span>` unconditionally, even for failed or pending transactions.
  2. On lines 189–195, each purchased course row renders an `[Open]` button (`/learn/${item.course._id}`) regardless of whether the transaction succeeded, failed, or was refunded. Clicking this link for a failed or refunded order redirects to `LessonViewer.tsx`, which subsequently throws `403 Forbidden` ("You are not enrolled in this course") because no active enrollment was created.
- **Reproduction Steps**:
  1. Trigger an asynchronous order or simulate a failed/pending payment transaction in MongoDB (`paymentStatus: "failed"` or `"pending"`).
  2. Log in as the student and navigate to `/purchase-history`.
  3. Observe that the order row displays a bright emerald checkmark with the status `"Completed"`.
  4. Click "View Invoice" / "Print Receipt"; observe that the invoice modal states `"Status: Paid & Enrolled"`.
  5. Click the `[Open]` link next to the course item; observe that the student is dropped into `/learn/:courseId` where a raw 403 error toast is displayed.
- **Remediation**:
  - In `PurchaseHistoryPage.tsx`, replace the hardcoded "Completed" status badge with a dynamic badge helper that inspects `order.paymentStatus`:
    - `"completed"`: Emerald badge (`CheckIcon`, "Completed").
    - `"pending"`: Amber badge (`ClockIcon`, "Pending Payment").
    - `"failed"`: Rose/Red badge (`XCircleIcon`, "Failed").
    - `"refunded"`: Slate badge (`ArrowPathIcon`, "Refunded").
  - Dynamically render the receipt modal status based on `activeReceipt.paymentStatus`.
  - Only render the `[Open]` `/learn/:courseId` link if `order.paymentStatus === 'completed'`. For pending or failed orders, render a retry or support prompt instead.

---

#### AUDIT-112: Bulk Instructor Review Nuclear Fallback Processes Entire Platform Pending Queue When Selection is Empty
- **Category**: Admin Oversight & Bulk Action Safeguard Failure
- **Priority**: `P1 — High`
- **Impacted Roles**: Admin, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/admin/adminController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminController.ts#L232-L270)
  - [`frontend/src/features/admin/pages/InstructorReviews.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/InstructorReviews.tsx#L123-L145)
- **Description**:
  In `frontend/src/features/admin/pages/InstructorReviews.tsx#L124-136`, `handleBulk` attempts to extract selected IDs:
  ```typescript
  const ids = userIds ?? (selected.size > 0 ? Array.from(selected) : undefined);
  ```
  If an admin clicks a bulk action button when `selected.size === 0` (or if header selection desynchronizes), `ids` evaluates to `undefined`, and `api.patch('/admin/instructors/bulk-approve', { userIds: undefined })` is dispatched.
  In `backend/src/controllers/admin/adminController.ts#L244-250`:
  ```typescript
  const filter: Record<string, any> = { instructorStatus: "pending" };
  if (Array.isArray(userIds) && userIds.length > 0) {
    filter._id = { $in: userIds };
  }
  ```
  Because `userIds` is `undefined`, the controller does **not** append `{ _id: { $in: userIds } }`. Instead, it executes:
  ```typescript
  const pendingInstructors = await User.find({ instructorStatus: "pending" });
  ```
  It unconditionally processes **every single pending instructor in the entire platform database**!
  An accidental click with zero items selected indiscriminately approves (or rejects) hundreds of pending applicant dossiers across the platform, bypassing individual dossier vetting, creating bulk notifications, and granting instructor platform privileges without administrative intent.
- **Reproduction Steps**:
  1. Have 3 pending instructor applicants in the database (`user1`, `user2`, `user3`).
  2. Navigate to `/admin/instructor-reviews` as an administrator.
  3. Ensure 0 checkboxes are selected.
  4. Trigger `handleBulk(..., 'approved')` (or invoke the bulk approve action).
  5. Inspect the backend logs and database: all 3 pending instructors are instantly bulk-approved, promoted to `role: "instructor"`, and notified.
- **Remediation**:
  - In `backend/src/controllers/admin/adminController.ts:bulkApproveInstructors` and `bulkRejectInstructors`, strictly validate `userIds`:
    ```typescript
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required and cannot be empty for bulk operations" });
    }
    ```
  - In `frontend/src/features/admin/pages/InstructorReviews.tsx`, disable the bulk action buttons whenever `selected.size === 0`, and display a confirmation modal detailing the exact number of applicants targeted before dispatching.

---

#### AUDIT-113: Student Unenroll Modal Misleading Progress Retention Promise Contradicts Permanent Deletion
- **Category**: Conflicting UI Indicators & State-Synchronization Inconsistency
- **Priority**: `P1 — High`
- **Impacted Roles**: Student
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/enrollment/components/EnrollmentCard.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/enrollment/components/EnrollmentCard.tsx#L161-L184)
  - [`backend/src/controllers/enrollment/enrollmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/enrollment/enrollmentController.ts#L430-L440)
- **Description**:
  In `frontend/src/features/enrollment/components/EnrollmentCard.tsx#L167-170`, when an active student clicks "Unenroll" on a course card, a confirmation dialog pops up with the following assurance:
  ```tsx
  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
    Are you sure you want to unenroll from <strong className="text-slate-800 dark:text-slate-200">"{c.title}"</strong>?
    Your completed lesson history will remain saved if you enroll again.
  </p>
  ```
  However, in `backend/src/controllers/enrollment/enrollmentController.ts#L430-440`, `cancelEnrollment` executes:
  ```typescript
  // Remove lesson progress for this student in this course
  const sections = await Section.find({ course: enrollment.course }).select("_id").lean();
  const sectionIds = sections.map((s) => s._id);
  if (sectionIds.length > 0) {
    const lessons = await Lesson.find({ section: { $in: sectionIds } }).select("_id").lean();
    const lessonIds = lessons.map((l) => l._id);
    if (lessonIds.length > 0) {
      await LessonProgress.deleteMany({ user: enrollment.student, lesson: { $in: lessonIds } });
    }
  }
  ```
  The backend immediately and permanently wipes **every single `LessonProgress` record** for that student in that course!
  When the student re-enrolls later, all their lesson progress, video timestamps, and quiz completion flags are completely gone (0% progress), directly contradicting the explicit guarantee given in the confirmation modal.
- **Reproduction Steps**:
  1. Enroll in a course and complete 4 out of 10 lessons.
  2. Open `/my-courses` and click the unenroll (trash/drop) icon on the course card.
  3. Read the modal text: observe it explicitly claims: *"Your completed lesson history will remain saved if you enroll again."*
  4. Confirm unenrollment.
  5. Inspect the MongoDB collection: `db.lessonprogresses.find({ user: studentId, lesson: { $in: courseLessonIds } })` returns zero documents.
  6. Re-enroll in the course; observe that progress is at 0%, and all previously completed lessons must be taken from scratch.
- **Remediation**:
  - Update the confirmation modal copy in `EnrollmentCard.tsx` to truthfully reflect system behavior:
    *"Are you sure you want to unenroll from \"{c.title}\"? Warning: All your completed lesson history and progress will be permanently reset."*
  - Alternatively, if product intent is to preserve progress upon re-enrollment, soft-delete or retain `LessonProgress` records instead of executing `LessonProgress.deleteMany`.

---

#### AUDIT-114: Missing Lesson Item Update Route & Controller Deadlocks Content Modification
- **Category**: Unhandled Lifecycle Transitions & Deadlocked Authoring Workflow
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/lessonItemController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/lessonItemController.ts#L10-L130)
  - [`backend/src/routes/lessonRoutes.ts`](file:///c:/Users/user/projects/skillkart/backend/src/routes/lessonRoutes.ts#L1-L30)
  - [`backend/src/models/LessonItem.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/LessonItem.ts#L41)
  - [`frontend/src/features/instructor/pages/EditCourse.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EditCourse.tsx#L486-L530)
- **Description**:
  In `backend/src/controllers/course/lessonItemController.ts`, only two endpoints are implemented:
  1. `createLessonItem` (`POST /api/lessons/:lessonId/items`)
  2. `deleteLessonItem` (`DELETE /api/lessons/:lessonId/items/:itemId`)
  There is **no update endpoint** (`PUT /api/lessons/:lessonId/items/:itemId` or `PATCH /api/lessons/:lessonId/items/:itemId`) in either `lessonItemController.ts` or `backend/src/routes/lessonRoutes.ts`.
  Because `LessonItem.ts` defines a unique compound index `{ lesson: 1, order: 1 }`:
  - If an instructor makes a typo in text content, updates an external resource link, or uploads an updated PDF or video URL, they have no mechanism to edit the existing item.
  - The only workaround is to delete the item and recreate it. However, deleting and recreating appends the new item to the end of the lesson (highest `order`), disrupting the pedagogical order of multi-item lessons with no UI or API support to restore the original position.
- **Reproduction Steps**:
  1. As an instructor, open an existing course in the course editor (`/instructor/courses/:id/edit`).
  2. Expand a lesson that contains multiple items (e.g., a video followed by notes and downloadable resources).
  3. Attempt to edit the description or URL of the second item; observe there is no edit action button in the curriculum editor UI.
  4. Inspect API routes: attempting `PUT /api/lessons/:lessonId/items/:itemId` yields `404 Not Found`.
- **Remediation**:
  - Implement `updateLessonItem` in `backend/src/controllers/course/lessonItemController.ts` that validates lesson ownership and updates `type`, `title`, and `content`.
  - Register `router.put("/:lessonId/items/:itemId", authenticate, updateLessonItem)` in `backend/src/routes/lessonRoutes.ts`.
  - Add an "Edit Item" modal in `EditCourse.tsx` to enable instructors to update existing lesson items in place without reordering disruption.

---

#### AUDIT-115: Admin Financial Reports Ledger Unconditionally Renders Emerald Badges for Failed and Refunded Transactions
- **Category**: Misleading Status Badges & Cross-Role Reporting Discrepancy
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/admin/pages/FinancialReports.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/FinancialReports.tsx#L482-L487)
  - [`backend/src/controllers/admin/adminFinancialController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminFinancialController.ts#L100-L130)
- **Description**:
  In `frontend/src/features/admin/pages/FinancialReports.tsx#L482-487`, the Transactions & Invoices Ledger displays recent platform order activity.
  The status column is styled with hardcoded emerald classes:
  ```tsx
  <td className="px-4 py-3.5">
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
      {tx.paymentStatus}
    </span>
  </td>
  ```
  If a customer's transaction status is `failed`, `pending`, or `refunded`, the badge renders the status text inside a bright emerald (green) pill.
  For an administrator or financial auditor reviewing platform transaction logs, failed and refunded purchases visually mimic completed revenue events, creating severe confusion and misleading financial oversight.
- **Reproduction Steps**:
  1. Generate test orders with statuses: one `completed`, one `failed`, and one `refunded`.
  2. Navigate to `/admin/financial-reports` as an administrator.
  3. Scroll down to the "Transactions & Invoices Ledger" table.
  4. Observe that the `FAILED` and `REFUNDED` transactions are rendered with identical green pills (`bg-emerald-100 text-emerald-700`) as the `COMPLETED` transaction.
- **Remediation**:
  - In `FinancialReports.tsx`, define a semantic badge color mapping function for `paymentStatus`:
    - `completed` / `paid`: `bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300`
    - `pending`: `bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`
    - `failed`: `bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300`
    - `refunded`: `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`

---

#### AUDIT-116: Hardcoded Dollar Currency Formatting in Course Catalog and Cart Promo Badges Bypasses System Currency
- **Category**: Conflicting UI Indicators & Multi-Role Setting Desync
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/course/pages/CourseList.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/course/pages/CourseList.tsx#L912)
  - [`frontend/src/features/cart/pages/CartPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/cart/pages/CartPage.tsx#L693)
  - [`frontend/src/context/CurrencyContext.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/context/CurrencyContext.tsx#L1-L40)
- **Description**:
  The platform provides a centralized `CurrencyContext` that loads `primaryCurrency` (`USD`, `EUR`, `GBP`, `INR`, etc.) from platform settings and formats all prices with the configured symbol and decimal places via `formatAmount(amount)`.
  While course detail pages and checkout tables utilize `CurrencyContext`, several key public views continue to hardcode the `$` dollar sign:
  1. `frontend/src/features/course/pages/CourseList.tsx#L912`:
     ```tsx
     {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
     ```
  2. `frontend/src/features/cart/pages/CartPage.tsx#L693`:
     ```tsx
     {promo.discountType === 'percentage'
       ? `${promo.discountValue}% off`
       : `$${promo.discountValue} off`}
     ```
  When the administrator configures the LMS to operate in a non-USD currency (such as Euros `€` or British Pounds `£`), students browsing the catalog and viewing cart discount badges see prices formatted with `$`, while the cart total and invoice receipts display `€`. This causes jarring currency mismatch across customer purchasing journeys.
- **Reproduction Steps**:
  1. Log in as admin and navigate to `/admin/settings`.
  2. Change "Primary Currency" to `EUR (€)`.
  3. Open `/courses` (Course Catalog) in an incognito window.
  4. Inspect course cards: price tags display `$49.99` instead of `€49.99`.
  5. Add a course to the cart and apply a fixed discount coupon: observe promo badge displays `"$10 off"` while the cart subtotal and summary display `€`.
- **Remediation**:
  - In `CourseList.tsx`, import `useCurrency` and replace `$${course.price.toFixed(2)}` with `formatAmount(course.price)`.
  - In `CartPage.tsx`, replace `$${promo.discountValue} off` with `${formatAmount(promo.discountValue)} off`.

---

#### AUDIT-117: Cross-Instructor Course Coupon Exploitation & Unauthorized Revenue Deduction
- **Category**: Security Vulnerability & Multi-Role Financial Exploitation
- **Priority**: `P0 — Critical`
- **Impacted Roles**: Instructor, Admin, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/couponController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/couponController.ts#L331-L405,L410-L534)
  - [`backend/src/controllers/orderController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/orderController.ts#L181-L218)
  - [`frontend/src/features/instructor/pages/Coupons.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Coupons.tsx#L140-L210)
- **Description**:
  In `couponController.ts`, instructors have permission to create and update coupons for courses (`scope: "single_course"`).
  However, in `createCoupon` (lines 331–405) and `updateCoupon` (lines 410–534):
  1. The controller extracts `courseId` from `req.body`:
     ```typescript
     if (scope === "single_course") {
       if (!courseId || !isValidObjectId(courseId)) {
         return res.status(400).json({ message: "Valid courseId is required for single_course coupons" });
       }
       couponData.course = new Types.ObjectId(courseId as string);
     }
     ```
  2. The controller **completely fails to verify that the requesting instructor owns the course** (`course.instructor.toString() === req.user.id`). Any instructor can pass the `_id` of any other instructor's course when creating or updating a coupon.
  3. In `orderController.ts:checkout` (lines 181–218), when a student checks out with a single-course coupon, the discount is funded directly by the instructor who authored the target course:
     ```typescript
     if (isSingleCourse && isTargetCourse) {
       itemDiscount = calculateDiscount(item.price);
       item.discount = itemDiscount;
       item.finalPrice = item.price - itemDiscount;
       // Instructor payout is derived from final discounted price!
       item.instructorPayout = Math.round(item.finalPrice * (liveInstructorShare / 100) * 100) / 100;
     }
     ```
  4. As a result, Instructor A can create a 90% off coupon targeting Instructor B's popular $200 course. When students purchase Instructor B's course using this coupon, Instructor B absorbs the full $180 discount and receives a payout of only $16 (80% of $20) instead of $160 (80% of $200). Instructor A can slash peer instructors' earnings and manipulate marketplace prices without authorization.
- **Reproduction Steps**:
  1. Log in as Instructor A.
  2. Send `POST /api/coupons` with payload:
     ```json
     {
       "code": "EXPLOIT90",
       "discountType": "percentage",
       "discountValue": 90,
       "scope": "single_course",
       "courseId": "<COURSE_ID_OWNED_BY_INSTRUCTOR_B>",
       "expiresAt": "2028-01-01"
     }
     ```
  3. Observe that the API returns `201 Created` without validating course ownership.
  4. As a student, add Instructor B's $200 course to the cart and apply coupon `EXPLOIT90`.
  5. Complete checkout.
  6. In MongoDB, inspect the created `Order` record: `item.instructorPayout` is slashed to 80% of $20 ($16.00). Instructor B's earnings ledger reflects an unauthorized 90% revenue cut.
- **Remediation**:
  - In `couponController.ts:createCoupon` and `updateCoupon`, add strict course ownership validation:
    ```typescript
    if (scope === "single_course") {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Referenced course not found" });
      }
      if (req.user.role !== "admin" && course.instructor.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only create coupons for courses you instruct." });
      }
      couponData.course = course._id;
    }
    ```
  - In `frontend/src/features/instructor/pages/Coupons.tsx`, ensure the course selection dropdown only allows choosing courses authored by the authenticated instructor.

---

#### AUDIT-118: Cross-Instructor Student Submissions Leak & Data Privacy Breach via Unscoped Course Query
- **Category**: Multi-Role Data Isolation Bypass & Student Privacy Breach
- **Priority**: `P1 — High`
- **Impacted Roles**: Instructor, Student, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L408-L440)
  - [`frontend/src/features/instructor/pages/Assignments.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/Assignments.tsx#L85-L130)
- **Description**:
  In `assignmentController.ts:getInstructorSubmissions` (lines 408–440), the endpoint retrieves assignment submissions for instructor grading:
  ```typescript
  const instructorCourses = await Course.find({ instructor: req.user.id }).select("_id").lean();
  const courseIds = instructorCourses.map((c) => c._id);
  const courseFilter: Record<string, unknown> = {
    course: { $in: courseIds },
  };

  if (courseId && isValidObjectId(courseId as string)) {
    courseFilter.course = courseId; // Critical Vulnerability: unconditionally overwrites courseFilter!
  }
  ```
  1. If `courseId` is provided as a query parameter (e.g., `GET /api/assignments/instructor/submissions?courseId=<VICTIM_COURSE_ID>`), the controller assigns `courseFilter.course = courseId` without checking if `courseId` is in `courseIds`.
  2. The `$in: courseIds` ownership constraint is completely destroyed.
  3. Mongoose executes `AssignmentSubmission.find(courseFilter)` populated with `student` (`name`, `email`, `avatar`), `assignment`, and `course`.
  4. Any instructor on the platform can inspect any other instructor's students, assignment submissions, proprietary deliverables, uploaded student zip/pdf files, private repository links, student personal notes, and internal grading records.
- **Reproduction Steps**:
  1. Log in as Instructor A.
  2. Obtain the `_id` of a course created by Instructor B (readily available from public `/courses` catalog).
  3. Send `GET /api/assignments/instructor/submissions?courseId=<INSTRUCTOR_B_COURSE_ID>` with Instructor A's authorization token.
  4. Observe `200 OK` returning an array of student submissions for Instructor B's course, including student emails, names, uploaded files, and grades.
- **Remediation**:
  - In `assignmentController.ts:getInstructorSubmissions`, validate that `courseId` belongs to the requesting instructor before scoping the query:
    ```typescript
    if (courseId && isValidObjectId(courseId as string)) {
      if (req.user.role !== "admin" && !courseIds.some((id) => id.toString() === courseId)) {
        return res.status(403).json({ message: "Access denied to this course's submissions." });
      }
      courseFilter.course = courseId;
    }
    ```

---

#### AUDIT-119: LessonViewer Query Parameter Stripping Destroys Notification Deep-Linking Context
- **Category**: State Synchronization & Navigation Workflow Desynchronization
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/student/pages/LessonViewer.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/student/pages/LessonViewer.tsx#L105,L175-L195,L440-L488)
  - [`backend/src/controllers/course/commentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/commentController.ts#L168,L179)
  - [`backend/src/controllers/assignmentController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/assignmentController.ts#L514)
  - [`backend/src/controllers/course/announcementController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/announcementController.ts#L124)
- **Description**:
  When interactions occur across the platform, backend controllers dispatch in-app notifications containing targeted deep-link URLs with query parameters:
  - Discussions: `link: /learn/${courseId}/${lessonId}?tab=discussion`
  - Announcements: `link: /learn/${courseId}?tab=announcements`
  - Assignments / Grades: `link: /learn/${courseId}?tab=assignments`
  However, `LessonViewer.tsx` has two critical architectural defects that break this workflow:
  1. **Tab State Ignores Query Parameters**: In `LessonViewer.tsx:105`, active tab state is defined as `const [activeTab, setActiveTab] = useState<'lesson' | 'notes' | 'discussion' | 'announcements' | 'assignments'>('lesson');`. It does not read `useSearchParams` or `window.location.search`. The active tab is statically forced to `'lesson'`.
  2. **Redirect Strips Query String**: When navigating to `/learn/:courseId?tab=assignments`, the viewer redirect effect (lines 175–193) executes:
     `navigate('/learn/' + courseId + '/' + p.lastLessonId, { replace: true });` or `navigate('/learn/' + courseId + '/' + lessons[0]._id, { replace: true });`.
     Because `location.search` is omitted from the path, the query string `?tab=assignments` is permanently stripped from the browser URL.
  3. Consequently, whenever a student or instructor clicks a notification about a discussion reply, a new assignment grade, or an instructor announcement, they are dropped onto the video player without tab context.
- **Reproduction Steps**:
  1. As an instructor, post an announcement or grade an assignment for a student.
  2. Log in as the student and open the notifications dropdown.
  3. Click the notification: *"Your assignment has been graded"*.
  4. Notice the browser redirects from `/learn/:courseId?tab=assignments` to `/learn/:courseId/:firstLessonId`.
  5. The query parameter `?tab=assignments` is lost, and the UI displays the `'lesson'` video player instead of opening the Assignments or Announcements tab.
- **Remediation**:
  - In `LessonViewer.tsx`:
    - Import `useSearchParams` from `react-router-dom`.
    - Initialize `activeTab` from `searchParams.get('tab')` if it matches one of the valid sub-tabs.
    - Synchronize `activeTab` with `searchParams` whenever tab changes occur.
    - When executing redirects from `/learn/:courseId`, preserve `location.search`:
      ```typescript
      navigate(`/learn/${courseId}/${targetLessonId}${location.search}`, { replace: true });
      ```

---

#### AUDIT-120: Instructor Minimum Payout Threshold Desynchronization & Hardcoded Currency UI
- **Category**: Configuration Desynchronization & Hardcoded UI Validation
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`frontend/src/features/instructor/pages/EarningsAndPayouts.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/instructor/pages/EarningsAndPayouts.tsx#L687-L697)
  - [`backend/src/controllers/instructor/instructorEarningsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/instructor/instructorEarningsController.ts#L328-L350)
  - [`backend/src/controllers/admin/adminSettingsController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/admin/adminSettingsController.ts)
- **Description**:
  In `EarningsAndPayouts.tsx:689`, the "Request Payout" modal input hardcodes HTML5 minimum validation and placeholder text:
  ```tsx
  <input
    type="number"
    step="0.01"
    min="50"
    max={summary.availableBalance}
    value={withdrawAmount}
    onChange={(e) => setWithdrawAmount(e.target.value)}
    placeholder="50.00"
    required
    ...
  />
  ```
  However, in `SystemSettings`, `minPayoutThreshold` is an admin-configurable dynamic setting:
  1. If an admin lowers the platform threshold to $25 via Admin Settings, instructors are blocked by browser client validation from requesting withdrawals under $50.
  2. If an admin raises the platform threshold to $100, the client permits submitting $50, which is then rejected by the server (`withdrawAmount < minThreshold`) with a 400 error toast, leaving the user confused.
  3. Furthermore, when the platform's primary currency is configured as EUR, GBP, JPY, or INR, the hardcoded number `50` is evaluated literally. For Japanese Yen (where 50 JPY is ~0.33 USD) or Indian Rupees (50 INR is ~0.60 USD), the threshold does not reflect proper currency scale.
- **Reproduction Steps**:
  1. As Admin, navigate to `/admin/settings` and configure `minPayoutThreshold: 25`.
  2. Log in as an Instructor with an available balance of $40.
  3. Open `/instructor/earnings` and click "Request Payout".
  4. Enter `40.00` and click Submit.
  5. The browser displays an HTML5 form validation tooltip: *"Value must be greater than or equal to 50"*, blocking the instructor despite meeting the platform's actual $25 requirement.
- **Remediation**:
  - Return `minPayoutThreshold` in `GET /api/instructor/earnings` summary response or expose it through public settings.
  - In `EarningsAndPayouts.tsx`, dynamically bind `min={summary.minPayoutThreshold || 50}` and render the dynamic threshold in helper text: `Min withdrawal: {formatAmount(minThreshold)}`.

---

#### AUDIT-121: Instructor Self-Course Wishlisting Allowed Leading to Dead-End "Move to Cart" Rejections
- **Category**: Multi-Role Inconsistency & Defective E-Commerce Transition
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/wishlist/wishlistController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/wishlist/wishlistController.ts#L108-L150)
  - [`frontend/src/features/wishlist/pages/WishlistPage.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/wishlist/pages/WishlistPage.tsx#L163-L182)
  - [`backend/src/controllers/cart/cartController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/cart/cartController.ts#L60-L80)
- **Description**:
  In `wishlistController.ts:addToWishlist` (lines 108–150), the endpoint checks if the student is already enrolled in the target course:
  ```typescript
  const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId, status: { $in: ["active", "completed"] } });
  if (enrollment) return res.status(400).json({ message: "You are already enrolled in this course" });
  ```
  However, it **never checks whether the requesting user is the instructor of the course** (`course.instructor.toString() === req.user.id`).
  1. An instructor browsing courses (or testing their own course) can add their own course to their wishlist.
  2. When the instructor navigates to `/wishlist`, `WishlistPage.tsx:163-182` renders a primary "Add to Cart" button for the wishlisted course.
  3. Clicking "Add to Cart" sends `POST /api/cart/items`.
  4. In `cartController.ts:addToCart`, the backend rejects with `400 Bad Request: Instructors cannot purchase their own courses`.
  5. The instructor receives an unexpected error toast, and the course remains stuck in the wishlist with no way to purchase or advance.
- **Reproduction Steps**:
  1. Log in as an Instructor who authored Course A.
  2. Navigate to `/courses` and click the heart icon on Course A to add it to the wishlist.
  3. Navigate to `/wishlist`.
  4. Observe Course A displayed with an active "Add to Cart" button.
  5. Click "Add to Cart".
  6. Observe error toast: *"Instructors cannot purchase their own courses"*.
- **Remediation**:
  - In `wishlistController.ts:addToWishlist`, reject instructors wishlisting their own courses:
    ```typescript
    if (course.instructor.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot wishlist your own course." });
    }
    ```
  - In `WishlistPage.tsx`, if `course.instructor?._id === user._id`, replace the "Add to Cart" button with a link to "Manage in Studio" (`/instructor/courses/:id/edit`).

---

#### AUDIT-122: Desynchronized Enrollment Completion Lifecycle on Curriculum Additions and Deletions
- **Category**: State Synchronization & Lifecycle Inconsistency
- **Priority**: `P1 — High`
- **Impacted Roles**: Student, Instructor, Admin
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/shared.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/shared.ts#L60-L67)
  - [`backend/src/controllers/course/lessonController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/lessonController.ts#L72-L75,L173-L182)
  - [`backend/src/controllers/course/progressController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/progressController.ts#L178-L215)
- **Description**:
  When an instructor creates a new lesson in an existing course (`lessonController.ts:createLesson`), the system calls `syncEnrollmentLessonCount(courseId)`.
  In `shared.ts:62-65`:
  ```typescript
  export async function syncEnrollmentLessonCount(courseId: string): Promise<void> {
    const totalLessons = await getCourseLessonCount(courseId);
    await Enrollment.updateMany({ course: courseId }, { $set: { totalLessonsCount: totalLessons } });
  }
  ```
  This implementation causes two severe state synchronization discrepancies:
  1. **Impossible Progress Display for Completed Students**:
     If a student previously finished all 5 lessons of a course, their enrollment has `status: "completed"` and `completedLessonIds.length === 5`.
     When the instructor adds a 6th lesson, `syncEnrollmentLessonCount` sets `totalLessonsCount = 6`.
     The student's enrollment status remains `"completed"`, but their calculated progress is `5 / 6 = 83%`.
     On the student dashboard and admin roster, the enrollment displays an impossible contradiction: *"83% Incomplete"* paired with a green *"Completed"* badge.
  2. **Locked Out of Completion Upon Lesson Deletion**:
     If a course had 6 lessons and a student completed 5, the student's status is `"active"` (83%).
     If the instructor deletes the 6th lesson, `syncEnrollmentLessonCount` reduces `totalLessonsCount` to 5.
     The student has now completed 5/5 lessons (100%).
     However, `syncEnrollmentLessonCount` never promotes the enrollment to `status: "completed"` or auto-issues the completion certificate.
     The student is locked in `"active"` status at 100% completion indefinitely unless they trigger an update on an existing lesson.
- **Reproduction Steps**:
  1. Complete all lessons of Course A (e.g. 3/3 lessons). Enrollment status is "completed".
  2. Log in as the instructor and add Lesson 4 to Course A.
  3. Return to Student dashboard `/my-learning`.
  4. Observe that Course A displays "75%" progress, but retains the green "Completed" status badge.
- **Remediation**:
  - In `shared.ts:syncEnrollmentLessonCount`:
    - Check for enrollments where `completedLessonIds.length < totalLessons` and `status === "completed"`, and demote them back to `status: "active"` (while retaining certificate records if policy allows).
    - Check for active enrollments where `completedLessonIds.length >= totalLessons && totalLessons > 0`, promote them to `status: "completed"`, and auto-issue certificates.

---

#### AUDIT-123: Course Schema Field Mismatch in Notes and Bookmarks User Feeds Discarding Thumbnails
- **Category**: Data Integrity & Contract Inconsistency
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/course/noteController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/noteController.ts#L253-L270)
  - [`backend/src/controllers/course/bookmarkController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/course/bookmarkController.ts#L161-L178)
  - [`backend/src/models/Course.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Course.ts#L48-L51)
- **Description**:
  In `getAllUserNotes` (`noteController.ts:260`) and `getAllUserBookmarks` (`bookmarkController.ts:168`), the queries populate course metadata using explicit field selection:
  ```typescript
  // noteController.ts:260
  const notes = await Note.find({ user: req.user.id })
    .populate("course", "title thumbnail")
    ...
  // bookmarkController.ts:168
  const bookmarks = await Bookmark.find({ user: req.user.id })
    .populate("course", "title thumbnail")
    ...
  ```
  However, in `Course.ts:48-51`, the schema defines the thumbnail property as `thumbnailUrl`:
  ```typescript
  thumbnailUrl: {
    type: String,
    trim: true,
  }
  ```
  Because Mongoose field projection strictly excludes non-requested attributes, querying for the non-existent field `thumbnail` causes Mongoose to drop `thumbnailUrl`. Any consumer or UI component expecting the course cover image in the study feed receives `undefined`, producing broken image placeholders.
- **Reproduction Steps**:
  1. As a student, create a note or bookmark in a course that has a thumbnail image.
  2. Send `GET /api/me/notes` or `GET /api/me/bookmarks`.
  3. Inspect the returned JSON payload: `course` object has `_id` and `title`, but `thumbnail` is `undefined` and `thumbnailUrl` is missing.
- **Remediation**:
  - In `noteController.ts:260` and `bookmarkController.ts:168`, change `.populate("course", "title thumbnail")` to `.populate("course", "title thumbnailUrl")`.

---

#### AUDIT-124: Unhandled Course Category Dissociation on Admin Category Deletion
- **Category**: Referential Integrity & Orphaned Foreign Keys
- **Priority**: `P2 — Medium`
- **Impacted Roles**: Admin, Instructor, Student
- **Status**: Pending
- **Affected Files**:
  - [`backend/src/controllers/category/categoryController.ts`](file:///c:/Users/user/projects/skillkart/backend/src/controllers/category/categoryController.ts#L188-L207)
  - [`backend/src/models/Course.ts`](file:///c:/Users/user/projects/skillkart/backend/src/models/Course.ts#L52-L56)
  - [`frontend/src/features/admin/pages/CategoryManagement.tsx`](file:///c:/Users/user/projects/skillkart/frontend/src/features/admin/pages/CategoryManagement.tsx)
- **Description**:
  In `categoryController.ts:deleteCategory` (lines 188–207), an administrator can delete an existing category:
  ```typescript
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  return res.json({ message: "Category deleted successfully" });
  ```
  1. The controller executes deletion without checking whether any courses are actively assigned to that category (`Course.countDocuments({ category: categoryId })`).
  2. Furthermore, it fails to perform a cascade unset on existing courses (`Course.updateMany({ category: categoryId }, { $unset: { category: 1 } })`).
  3. As a result, all courses that were assigned to the deleted category retain a dangling `category: ObjectId(...)` pointing to a non-existent document.
  4. When instructors open the course in the Studio editor, the category select dropdown displays blank or invalid values. In the course catalog, filtering by category behaves erratically, and catalog aggregations encounter broken references.
- **Reproduction Steps**:
  1. Create a Category "Cloud Computing" and assign Course X to it.
  2. As Admin, navigate to `/admin/categories` and delete "Cloud Computing".
  3. Inspect Course X in MongoDB: `course.category` still contains the `_id` of the deleted category.
  4. Open Course X in `/instructor/courses/:id/edit`: the category dropdown fails to match the assigned ID.
- **Remediation**:
  - In `categoryController.ts:deleteCategory`, check if any courses are assigned to the category. If courses exist, either reject deletion with a warning (`"Cannot delete category with active courses; please reassign courses first"`) or atomically unset the reference:
    ```typescript
    await Course.updateMany({ category: categoryId }, { $unset: { category: 1 } });
    ```
  - In `CategoryManagement.tsx`, display a confirmation modal warning the admin of how many courses will be affected.

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
| 94 | AUDIT-95 | Unify review loading with dedicated student review fetch and compute `ratingBreakdown` from aggregate ratings | Leave review, paginate to page 2, edit review; verify 200 update without 409 conflict and accurate rating percentages. |
| 95 | AUDIT-96 | Add review moderation endpoints with `authorize("admin", "instructor")` in `reviewController.ts` and UI actions | As instructor or admin, flag/remove abusive student review; verify review disappears from public course page. |
| 96 | AUDIT-97 | Parse `searchParams.get('tab')` in `LessonViewer.tsx` and sync with tab state | Click announcement notification link `?tab=announcements`; verify lesson player directly mounts and opens announcements tab. |
| 97 | AUDIT-98 | Check `revokedAt` in `getCertificateById` and `VerifyCertificatePage.tsx`, and clear revocation on re-enrollment | Cancel enrollment, verify certificate URL; verify revoked warning banner and verify re-issuance succeeds on re-completion. |
| 98 | AUDIT-99 | Deduplicate checkout action buttons and suppress carting on free courses in `CourseDetailsPage.tsx` | View free course; verify single "Enroll for Free" button; view paid course; verify single primary checkout action. |
| 99 | AUDIT-100 | Enforce consistent wishlist permissions across frontend/backend and format currency in `WishlistPage.tsx` | Visit wishlist as guest or instructor; verify proper auth redirect and localized currency formatting. |
| 100 | AUDIT-101 | Filter active/completed enrollments from cart recommendations in `CartPage.tsx` | Enroll in course, add another course to cart, view cart page; verify enrolled course is omitted from upsell strip. |
| 101 | AUDIT-102 | Implement atomic upsert pattern for singleton system settings in `adminController.ts` | Concurrently update platform settings during cold start; verify atomic update without duplicate singletons or null errors. |
| 102 | [x] AUDIT-103 | Guard auto-enrollment behind confirmed payment status (`paid`/`completed`) in `orderController.ts` | Simulate asynchronous pending payment; verify order created in pending state without premature active enrollment creation. |
| 103 | AUDIT-104 | Add reorder controls (move up/down) and bulk order persistence in `CourseFAQEditor.tsx` & `faqController.ts` | Reorder FAQs in instructor editor, refresh page; verify updated sort order persists accurately in student accordion. |
| 104 | [x] AUDIT-105 | Check `user.isActive !== false` in `googleAuthController.ts:googleLogin` | Deactivate user via admin, attempt Google OAuth login; verify 403 Forbidden response blocking suspended account access. |
| 105 | AUDIT-106 | Guard category deletion against assigned courses and log audit trail in `categoryController.ts` | Attempt to delete category with active courses; verify 400 rejection or clean cascade unset and verify audit log entry. |
| 106 | AUDIT-107 | Offer course reactivation prompt and notification on instructor restoration in `adminController.ts` | Deactivate instructor then re-activate in admin users; verify course restoration prompt and verify instructor notification. |
| 107 | AUDIT-108 | Add `cancelled` status and cancellation endpoint for pending payouts in `instructorEarningsController.ts` & alert admins | Submit payout request as instructor; verify cancel button refunds balance and verify admin notification received on submission. |
| 108 | AUDIT-109 | Set `isInstructorApproved: true` and `instructorStatus: "approved"` in `courseGeneratorService.ts` | Run course generator; verify generated instructors have approved flags and existing accounts are upgraded to instructor role. |
| 109 | AUDIT-110 | Guard against auto-clearing `revokedAt` on administratively revoked certificates in `progressController.ts` | Revoke student certificate as admin, update lesson progress as student; verify certificate remains revoked. |
| 110 | AUDIT-111 | Render dynamic badges based on `paymentStatus` and conditionally disable viewer link in `PurchaseHistoryPage.tsx` | Create pending and failed test orders, load `/purchase-history`; verify amber "Pending" and red "Failed" badges with disabled course access links. |
| 111 | AUDIT-112 | Require non-empty `userIds` array in `bulkApproveInstructors` / `bulkRejectInstructors` & disable bulk button in `InstructorReviews.tsx` | Click bulk approve with 0 users selected; verify UI button is disabled and backend returns 400 validation error without modifying unselected users. |
| 112 | AUDIT-113 | Correct confirmation modal copy in `EnrollmentCard.tsx` to warn about permanent progress reset or preserve progress in `enrollmentController.ts` | Click "Unenroll" on active course; verify modal accurately warns that course progress and lesson completions will be permanently reset. |
| 113 | AUDIT-114 | Implement `updateLessonItem` in `lessonItemController.ts` and bind PUT route in `lessonRoutes.ts` | Send `PUT /api/lessons/:lessonId/items/:itemId` with updated title/content; verify 200 OK and verify lesson item updates without order mutation. |
| 114 | AUDIT-115 | Apply semantic badge color mapping (`failed` -> rose, `refunded` -> amber, `completed` -> emerald) in `FinancialReports.tsx` | View Financial Reports transactions ledger with failed or refunded orders; verify red and amber badges render instead of deceptive green pills. |
| 115 | AUDIT-116 | Replace hardcoded `$` string templates with `formatAmount(course.price)` from `useCurrency()` in `CourseList.tsx` and `CartPage.tsx` | Change system primary currency to EUR (€) in admin settings; verify CourseList card prices and Cart promo discount badges render with `€`. |
| 116 | AUDIT-117 | Enforce course ownership verification in `couponController.ts:createCoupon` & `updateCoupon` | As instructor, attempt creating coupon for another instructor's course; verify 403 Forbidden rejection preventing revenue deduction theft. |
| 117 | AUDIT-118 | Check course ownership against `courseIds` before applying `courseFilter.course` in `assignmentController.ts:getInstructorSubmissions` | Send query with another instructor's `courseId`; verify 403 Access Denied preventing student submission and personal info leakage. |
| 118 | AUDIT-119 | Bind `useSearchParams` to `activeTab` and preserve `location.search` during redirects in `LessonViewer.tsx` | Click notification with `?tab=assignments` or `?tab=announcements`; verify player redirects while preserving search query and directly activates the target tab. |
| 119 | AUDIT-120 | Bind `min` to dynamic `minPayoutThreshold` from earnings response and format currency in `EarningsAndPayouts.tsx` | Change threshold in settings to $25 and currency to EUR; verify withdrawal input allows $25 and displays min helper in euros. |
| 120 | AUDIT-121 | Guard `wishlistController.ts:addToWishlist` against instructor's own courses & replace action in `WishlistPage.tsx` | Instructor attempts wishlisting own course; verify 400 rejection preventing trapped "Add to Cart" error. |
| 121 | AUDIT-122 | Handle completed status demotion on lesson creation and auto-completion on deletion in `shared.ts:syncEnrollmentLessonCount` | Complete course, add new lesson; verify enrollment status demotes to active. Delete lesson when student has all remaining lessons completed; verify auto-completion. |
| 122 | AUDIT-123 | Correct field projection from `thumbnail` to `thumbnailUrl` in `noteController.ts` and `bookmarkController.ts` | Retrieve user notes and bookmarks; verify populated `course` object includes valid `thumbnailUrl` string instead of undefined. |
| 123 | AUDIT-124 | Check for active courses and unset `category` on `Course` documents in `categoryController.ts:deleteCategory` | Delete category with associated courses; verify orphaned category references are cleanly unset from courses and catalog remains consistent. |



