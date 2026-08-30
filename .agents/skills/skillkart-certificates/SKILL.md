---
name: skillkart-certificates
description: Course completion certificate generation, verification, and PDF export in SkillKart.
---

# SkillKart Certificates Guidelines

This skill explains how the Certificate system works in the SkillKart workspace, including generation, unique ID assignment, public verification, and PDF downloading.

---

## Overview

- **Model Location:** `backend/src/models/Certificate.ts`
- **Controller Location:** `backend/src/controllers/certificate/certificateController.ts`, `backend/src/controllers/course/progressController.ts`
- **Route Location:** `backend/src/routes/certificateRoutes.ts`
- **Frontend Location:** `frontend/src/pages/VerifyCertificatePage.tsx`

---

## Certificate Issuance

Certificates are issued automatically when a student completes all mandatory lessons in a course. This logic is handled in `updateLessonProgress` inside `progressController.ts`.

### Automatic Generation
`progressController.ts` uses `$setOnInsert` with `findOneAndUpdate` to ensure that a certificate is only issued once per student per course when their enrollment status changes to `"completed"`.

```typescript
import Certificate from "../../models/Certificate";

// Auto-issue certificate on completion
await Certificate.findOneAndUpdate(
  { student: studentId, course: courseId },
  {
    $setOnInsert: {
      student: studentId,
      course: courseId,
      enrollment: enrollmentId,
      issuedAt: new Date(),
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
```

---

## Certificate Verification & PDF Download

Each certificate is generated with a unique, human-readable 16-character alphanumeric `certificateId` (e.g. `SK-9A3F-2BC8-112E`).
- **Backend Endpoint**: `GET /api/certificates/verify/:certificateId` (Public, no auth required). Returns populated student and course details.
- **Frontend Verification & PDF Page**: `/certificates/verify/:certificateId`.
  - Displays official SkillKart certificate frame with golden seal, recipient name, course title, completion date, and credential ID.
  - Features a "Download / Print PDF" action with `@media print` optimized CSS to produce clean certificate PDFs without web chrome or navigation bars.

---

## Extending Certificates

If you need to add more data to the certificate (e.g., grade, specific skills, QR code), make sure to:
1. Update the `Certificate` Mongoose schema in `backend/src/models/Certificate.ts`.
2. Update the public verification endpoint in `certificateController.ts`.
3. Update the frontend UI in `VerifyCertificatePage.tsx`.
4. Keep this `SKILL.md` in sync.
