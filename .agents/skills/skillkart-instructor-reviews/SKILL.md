---
name: skillkart-instructor-reviews
description: Instructor application, review, and dual-mode promotion subsystem for SkillKart LMS — applicant vetting, dossier evaluation, approval/rejection reasons, and auto-approval policies.
---

# SkillKart Instructor Applications & Reviews Guidelines

This skill documents the complete Instructor Application, Review, and Dual-Mode Promotion subsystem in SkillKart LMS.

---

## Overview

- **Models:**
  - `backend/src/models/User.ts` (`instructorStatus`, `isInstructorApproved`, `instructorRejectionReason`, `instructorApplication`)
  - `backend/src/models/SystemSettings.ts` (`requireInstructorApproval`, `requireCourseApproval`)
- **Controllers:**
  - `backend/src/controllers/user/userController.ts` (`applyForInstructor`)
  - `backend/src/controllers/admin/adminController.ts` (`getPendingInstructors`, `bulkApproveInstructors`)
  - `backend/src/controllers/admin/adminSettingsController.ts` (`updateAdminSettings`)
- **Routes:**
  - `POST /api/users/apply-instructor`
  - `GET /api/admin/instructor-reviews`
  - `POST /api/admin/instructor-reviews/bulk`
- **Frontend Pages:**
  - `frontend/src/pages/Profile.tsx` (Dedicated "Teach on SkillKart" tab & application modal)
  - `frontend/src/features/admin/pages/InstructorReviews.tsx` (`/admin/instructor-reviews`)
  - `frontend/src/features/admin/layout/AdminLayout.tsx` (Pending count live badge)

---

## Dual-Mode Architecture

SkillKart uses a **Dual-Mode** instructor architecture:
1. **Instructors retain full student capabilities**:
   - Enrolled courses, study notes, bookmarks, quiz submissions, certificates, shopping cart, and wishlist remain 100% accessible.
   - Instructors switch to teaching via the Instructor Studio dropdown or button, without having separate accounts.
2. **Student Profile Integrity**:
   - Applying to become an instructor does **not** overwrite the user's personal student `headline` or `bio`.
   - The application is stored in an independent `instructorApplication` subdocument.

---

## Data Schema

### User Model Subdocument (`IInstructorApplication`)

```typescript
export interface IInstructorApplication {
  teachingExperience: "none" | "in_person" | "online" | "professional";
  primaryTopic: string;               // Domain to teach (max 120 chars)
  experienceDetails: string;          // Credentials, teaching history, syllabus goals (min 20, max 1000 chars)
  sampleVideoOrPortfolioUrl?: string; // YouTube, Loom, GitHub, portfolio link
  linkedinUrl?: string;
  appliedAt: Date;
  rejectionReason?: string;
}
```

### User Status Lifecycle
- `instructorStatus`: `"none" | "pending" | "approved" | "rejected"`
- `isInstructorApproved`: boolean (default `false`)
- `instructorRejectionReason`: string | undefined

---

## Application & Review Flow

1. **Student Submits Application (`POST /api/users/apply-instructor`)**:
   - Gated if already an instructor or already has `instructorStatus: 'pending'`.
   - Reads `SystemSettings.requireInstructorApproval`.
   - If `true`: Sets `instructorStatus: 'pending'`, `isInstructorApproved: false`, clears old rejection reason.
   - If `false` (Auto-Approval ON): Directly promotes user `role: 'instructor'`, `instructorStatus: 'approved'`, `isInstructorApproved: true`.

2. **Admin Review (`/admin/instructor-reviews`)**:
   - Displays all pending applications with primary topic, experience level badge, date applied, and applicant identity.
   - **View Application Dossier**: Expands to show credentials, experience details, and clickable video/portfolio and LinkedIn links.
   - **Approve Selected / Approve All**: Promotes users to `role: 'instructor'`, dispatches in-app notifications, and logs audit entries.
   - **Reject Modal**: Mandatory rejection reason input (up to 500 chars). Sets `instructorStatus: 'rejected'`, stores reason, notifies the applicant, and logs audit trail.

3. **Reapply Flow on Student Profile**:
   - When rejected, the "Teach on SkillKart" tab in `Profile.tsx` displays the exact admin feedback reason.
   - The student clicks **"Reapply to Become an Instructor"**, which pre-fills their previous dossier so they can address feedback and re-submit.

4. **Independent Auto-Approval Toggles**:
   - `requireInstructorApproval`: Controls instructor applicant manual review.
   - `requireCourseApproval`: Controls whether newly published courses require admin review in `/admin/courses`.
   - Live **Auto-Approve** toggle switch directly in the header of `/admin/instructor-reviews` allows admins to toggle instructor auto-approval on the fly.
