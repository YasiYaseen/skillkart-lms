---
name: skillkart-certificates
description: Course completion certificate generation, verification, PDF export, and certificate time lock (anti-cheat Guard 3) in SkillKart.
---

# SkillKart Certificates Guidelines

This skill explains how the Certificate system works in the SkillKart workspace, including generation, unique ID assignment, public verification, PDF downloading, and the enrollment-to-certificate time lock guard.

---

## Overview

- **Model Location:** `backend/src/models/Certificate.ts`
- **Controller Location:** `backend/src/controllers/certificate/certificateController.ts`, `backend/src/controllers/course/progressController.ts`
- **Route Location:** `backend/src/routes/certificateRoutes.ts`
- **Frontend Location:** `frontend/src/pages/VerifyCertificatePage.tsx`

---

## Certificate Model Fields

```typescript
{
  student: ObjectId;              // ref: User
  course: ObjectId;               // ref: Course
  enrollment: ObjectId;           // ref: Enrollment
  certificateId: string;          // auto-generated 16-char alphanumeric (e.g. SK-9A3F-2BC8-112E)
  issuedAt: Date;
  /**
   * If set, the certificate is on hold and not publicly verifiable until this timestamp.
   * Used by Guard 3 (enrollment-to-certificate time lock) to prevent instant certificate sharing.
   * The student can still view/download their cert — only the public /verify link is locked.
   */
  heldUntil?: Date;
  revokedAt?: Date;
  revocationReason?: string;
  isDisciplinaryRevocation?: boolean;
  revokedBy?: ObjectId;           // ref: User (admin who revoked)
}
// Unique compound index: { student: 1, course: 1 }
```

---

## Certificate Issuance

Certificates are issued automatically when a student completes all mandatory lessons in a course. This logic is handled in `updateLessonProgress` inside `progressController.ts`.

### Automatic Generation
`progressController.ts` uses `Certificate.create()` when auto-completion fires. It may include a `heldUntil` date (see Guard 3 below).

```typescript
import Certificate from "../../models/Certificate";

// Auto-issue certificate on completion
const certDoc = await Certificate.create({
  student: req.user.id,
  course: course._id,
  enrollment: enrollment._id,
  issuedAt: enrollment.completedAt,
  ...(heldUntilDate ? { heldUntil: heldUntilDate } : {}),
});
```

---

## Certificate Time Lock (Anti-Cheat Guard 3)

### Purpose
Prevents a student from enrolling in a 40-hour course, clicking through all lessons in 60 seconds, and immediately sharing a verifiable public certificate link.

### Logic (inside `progressController.ts` auto-completion chain)
```typescript
// Sum declared lesson durations for the whole course
const totalCourseDurationMs = allLessons.reduce(
  (sum, l) => sum + (l.durationMinutes || 0), 0
) * 60 * 1000;

// Minimum required = 30% of declared duration
const minimumRequiredMs = totalCourseDurationMs > 0
  ? Math.floor(totalCourseDurationMs * 0.3)
  : 0;                // zero-duration courses are not affected

const enrollmentAgeMs = enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime();

let heldUntilDate: Date | undefined;
if (minimumRequiredMs > 0 && enrollmentAgeMs < minimumRequiredMs) {
  heldUntilDate = new Date(enrollment.enrolledAt.getTime() + minimumRequiredMs);
}
```

### Enforcement
- **Public verify** `GET /api/certificates/verify/:certificateId`: if `cert.heldUntil > new Date()` → returns `423 Locked` with `{ message, heldUntil }`.
- **Student list** `GET /api/certificates/me`: each cert includes `isHeld: boolean` and `heldUntil: Date | null`.
- **Progress response**: `updateLessonProgress` returns `certificateHeldUntil?: Date` when a hold is applied, so the frontend can show a notice.

### Student Experience
- Enrollment shows "completed" immediately — no blocking.
- Student can view and download their certificate PDF right away.
- Only the **public verification link** is temporarily locked.
- No notice is shown to genuine learners (their enrollment age exceeds the 30% threshold).
- The completion modal in `LessonViewer.tsx` shows an amber hold notice with the exact unlock date.

---

## Certificate Verification & PDF Download

Each certificate is generated with a unique, human-readable 16-character alphanumeric `certificateId` (e.g. `SK-9A3F-2BC8-112E`).
- **Backend Endpoint**: `GET /api/certificates/verify/:certificateId` (Public, no auth required). Returns populated student and course details. Returns `423` if certificate is under a time lock.
- **Frontend Verification & PDF Page**: `/certificates/verify/:certificateId`.
  - Displays official SkillKart certificate frame with golden seal, recipient name, course title, completion date, and credential ID.
  - Features a "Download / Print PDF" action with `@media print` optimized CSS to produce clean certificate PDFs without web chrome or navigation bars.

---

## Revocation & Reinstatement Lifecycle

- **Cancellation Revocation:** When an enrollment is cancelled (`cancelEnrollment`), `revokedAt` is set with `isDisciplinaryRevocation: false`. Re-enrolling and re-completing the course legitimately clears the revocation and re-issues the credential (AUDIT-98).
- **Disciplinary Revocation:** When an administrator revokes a certificate for academic dishonesty, misconduct, or cheating (`isDisciplinaryRevocation: true`, `revocationReason`), student lesson progress updates or claim requests CANNOT clear the revocation (AUDIT-110).
- **Admin Reinstatement:** Disciplinary revocations can only be restored via explicit administrator action: `PATCH /api/admin/certificates/:certificateId/reinstate`.

---

## Extending Certificates

If you need to add more data to the certificate (e.g., grade, specific skills, QR code), make sure to:
1. Update the `Certificate` Mongoose schema in `backend/src/models/Certificate.ts`.
2. Update the public verification endpoint in `certificateController.ts`.
3. Update the frontend UI in `VerifyCertificatePage.tsx`.
4. Keep this `SKILL.md` in sync.

