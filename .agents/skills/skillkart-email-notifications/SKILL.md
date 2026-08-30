---
name: skillkart-email-notifications
description: Email notification service for SkillKart — welcome emails, enrollment confirmations, certificate awards, and non-blocking transports.
---

# SkillKart Email Notifications Guidelines

Instructions on how to trigger and manage outbound transactional emails in the SkillKart LMS workspace.

---

## Overview

- **Service Location:** `backend/src/services/emailService.ts`
- **Integration Points:**
  - `backend/src/controllers/auth/authController.ts` & `googleAuthController.ts` (Welcome Email)
  - `backend/src/controllers/enrollment/enrollmentController.ts` (Enrollment Confirmation)
  - `backend/src/controllers/certificate/certificateController.ts` & `progressController.ts` (Certificate Awarded)

---

## How It Works

1. **Transporter Configuration**: If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` environment variables are present, Nodemailer connects to the configured SMTP server. In dev/test mode without credentials, an Ethereal test account is automatically provisioned and email preview URLs are logged to the console.
2. **Branded HTML Templates**: Responsive email layouts with dark headers, SkillKart branding, typography, styled cards, and call-to-action buttons.
3. **Non-Blocking Architecture**: All email functions handle errors internally and never reject or throw uncaught exceptions into the main HTTP request/response pipeline.

---

## Key Rules

- Always invoke email dispatch functions asynchronously with `.catch((err) => ...)` so failures never block database transactions or client responses.
- Use `sendWelcomeEmail(email, name)` upon successful user registration.
- Use `sendEnrollmentEmail(email, name, courseTitle, courseId)` upon successful course enrollment.
- Use `sendCertificateEmail(email, name, courseTitle, certificateId)` upon completion certificate generation.

---

## Code Example

```typescript
import { sendWelcomeEmail, sendEnrollmentEmail, sendCertificateEmail } from "../../services/emailService";

// Non-blocking welcome email
sendWelcomeEmail(user.email, user.name).catch((err) => {
  console.error("[EMAIL] Welcome email failed:", err);
});

// Non-blocking enrollment email
sendEnrollmentEmail(student.email, student.name, course.title, course._id.toString()).catch((err) => {
  console.error("[EMAIL] Enrollment email failed:", err);
});
```

---

## Integration Points

- `authController.ts`: Sends welcome email on new standard account registration.
- `googleAuthController.ts`: Sends welcome email on first-time Google OAuth sign-in.
- `enrollmentController.ts`: Sends enrollment confirmation email.
- `progressController.ts` & `certificateController.ts`: Sends certificate notification with verification URL on course completion.

---

## Extending This Feature

1. To add password reset or email verification emails, add dedicated template functions to `backend/src/services/emailService.ts`.
2. To configure production SMTP (SendGrid, Postmark, AWS SES, Gmail), set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `backend/.env`.
