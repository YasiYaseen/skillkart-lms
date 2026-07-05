---
name: skillkart-certificates
description: Instructions on how to manage and verify course completion certificates in the SkillKart LMS workspace.
---

# SkillKart Certificates Guidelines

This skill explains how the Certificate system works in the SkillKart workspace.

## Certificate Issuance

Certificates are issued automatically when a student completes all mandatory lessons in a course. This logic is handled in the `updateLessonProgress` function inside `progressController.ts`.

**Model Location:** `backend/src/models/Certificate.ts`

### Automatic Generation
The `progressController.ts` uses `$setOnInsert` with `findOneAndUpdate` to ensure that a certificate is only issued once per student per course when their enrollment status changes to `"completed"`.

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

## Certificate Verification
Each certificate is generated with a unique, human-readable 16-character alphanumeric `certificateId`.
Public verification is available at:
- **Backend**: `GET /api/certificates/verify/:certificateId`
- **Frontend**: `http://localhost:5173/certificates/verify/:certificateId`

## Extending Certificates
If you need to add more data to the certificate (e.g., grade, specific skills), make sure to:
1. Update the `Certificate` Mongoose schema in `backend/src/models/Certificate.ts`.
2. Update the public verification endpoint in `certificateController.ts`.
3. Update the frontend UI in `VerifyCertificatePage.tsx`.
