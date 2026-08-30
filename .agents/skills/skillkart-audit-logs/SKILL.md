---
name: skillkart-audit-logs
description: Admin audit logging and security event monitoring in SkillKart.
---

# SkillKart Admin Audit Logs Guidelines

Guidelines for logging, querying, and displaying security and administrative actions across the SkillKart platform.

---

## Overview

- **Model Location:** `backend/src/models/AuditLog.ts`
- **Service Location:** `backend/src/services/auditService.ts` (`logAdminAction`)
- **Controller Location:** `backend/src/controllers/admin/adminController.ts` (`getAuditLogs`)
- **Route Location:** `backend/src/routes/adminRoutes.ts` (`GET /api/admin/audit-logs`)
- **Frontend Location:** `frontend/src/features/admin/pages/AuditLogs.tsx` (Route: `/admin/audit-logs`)

---

## How It Works

1. Whenever an admin modifies critical platform entities (e.g. toggling user active status, approving/rejecting/unpublishing a course, modifying enrollments), `logAdminAction(...)` is called with:
   - `adminId`: Admin's user ID.
   - `action`: Specific string (e.g. `USER_ACTIVATED`, `USER_DEACTIVATED`, `COURSE_MODERATED`).
   - `targetType`: Entity type (`'user' | 'course' | 'enrollment' | 'system'`).
   - `targetId`: Target entity ID.
   - `targetName`: Readable target entity name or title.
   - `details`: Key-value payload snapshot of the change.
   - `ipAddress`: Request IP (`req.ip`).
2. Audit logs are written asynchronously without blocking the admin request.
3. The Admin Audit Logs UI displays filterable table rows with expandable JSON payloads.

---

## Key Rules

- Never block or crash a primary administrative transaction if audit log writing fails; log the error to Winston.
- Index `createdAt`, `action`, and `targetType` in MongoDB for fast log filtering.
- Only users with `role: 'admin'` are authorized to view the audit logs.

---

## Code Example

```typescript
import { logAdminAction } from '../../services/auditService';

// Inside adminController.ts
await logAdminAction({
  adminId: req.user._id,
  action: 'USER_DEACTIVATED',
  targetType: 'user',
  targetId: user._id.toString(),
  targetName: user.name,
  details: { reason: req.body.reason || 'Administrative suspension' },
  ipAddress: req.ip,
});
```

---

## Integration Points

- `adminController.ts` — logs on user status toggle and course status update.
- `AdminLayout.tsx` — provides navigation link to `/admin/audit-logs`.
- `AuditLogs.tsx` — provides search, filters, and JSON viewer.

---

## Extending This Feature

1. Add export to CSV/JSON for compliance reporting.
2. Add automated anomaly alerts via `emailService` for burst admin actions.
3. Update `AuditLogs.tsx` and this `SKILL.md`.
