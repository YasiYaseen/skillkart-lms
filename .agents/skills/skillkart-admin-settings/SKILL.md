---
name: skillkart-admin-settings
description: Platform System Configuration and Admin Control Center for SkillKart LMS.
---

# SkillKart Admin System Settings Guidelines

This skill explains how the Platform System Configuration subsystem works in the SkillKart LMS workspace, including singleton settings storage, revenue commission splits, maintenance downtime controls, access policies, and SMTP diagnostics.

---

## Overview

- **Model Location:** `backend/src/models/SystemSettings.ts`
- **Validator Location:** `backend/src/validators/adminSettings.validator.ts`
- **Controller Location:** `backend/src/controllers/admin/adminSettingsController.ts`
- **Route Location:** `backend/src/routes/adminRoutes.ts` (`/api/admin/settings`, `/api/admin/settings/test-email`), `backend/src/server.ts` (`/api/settings/public`)
- **Frontend Location:** `frontend/src/features/admin/pages/SystemSettings.tsx`

---

## How It Works

1. **Singleton Configuration Pattern:**
   `SystemSettings` maintains a single document (`{ isSingleton: true }`) in MongoDB holding global platform configuration. The helper function `getOrCreateSettings()` retrieves or lazily seeds the defaults.
2. **Public Endpoint:**
   `GET /api/settings/public` is exposed publicly to hydrate the storefront frontend (platform name, support email, maintenance mode status, registration open status) without exposing secret or financial configurations.
3. **Admin Endpoints:**
   - `GET /api/admin/settings`: Protected by `protect, authorize('admin')`. Returns all configuration options.
   - `PUT /api/admin/settings`: Validates inputs with Zod, applies updates, and logs an immutable entry in the `AuditLog`.
   - `POST /api/admin/settings/test-email`: Runs a simulated diagnostic SMTP dispatch test with latency, deliverability status, and handshake feedback.

---

## Key Rules

- Always use Zod `updateAdminSettingsSchema` in the controller to validate ranges (e.g., commission rates `0-100`, positive payout thresholds).
- Synchronize `platformCommissionRate` and `instructorPayoutShare` so their sum always equals 100%.
- Log all configuration modifications in `AuditLog` using `recordAuditLog({ targetType: "system" })`.
- Wrap side effects and audit logs in `try/catch` so unexpected errors do not block settings persistence.

---

## Code Example

```typescript
import SystemSettings from "../../models/SystemSettings";
import { recordAuditLog } from "../../services/auditService";

// Fetch singleton settings
let settings = await SystemSettings.findOne({ isSingleton: true });
if (!settings) {
  settings = await SystemSettings.create({ isSingleton: true });
}

// Update settings
settings.platformCommissionRate = 20;
settings.instructorPayoutShare = 80;
await settings.save();
```

---

## Integration Points

- `auditService.ts` — logs `SYSTEM_SETTINGS_UPDATED` action on every modification.
- `Header.tsx` — polls `/api/settings/public` to display the global maintenance banner if active.
- `instructorEarningsController.ts` — uses commission rates and withdrawal threshold rules.

---

## Extending This Feature

1. Add any new fields to `backend/src/models/SystemSettings.ts`.
2. Add Zod validation in `backend/src/validators/adminSettings.validator.ts`.
3. Expose the field in `adminSettingsController.ts` (`getPublicSettings` if public, `getAdminSettings`/`updateAdminSettings` for admin).
4. Update the tabs and form inputs in `SystemSettings.tsx`.
5. Keep this `SKILL.md` in sync.
