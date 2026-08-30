---
name: skillkart-auth
description: Authentication and authorization patterns for SkillKart — JWT, Google OAuth, onboarding flow, and route protection middleware.
---

# SkillKart Auth Guidelines

Covers email/password auth, Google OAuth, JWT issuance, route protection, and role-based access.

---

## Overview

- **Controllers:** `backend/src/controllers/auth/`
  - `authController.ts` — register, login
  - `googleAuthController.ts` — Google OAuth via access token
  - `onboardingController.ts` — post-login onboarding step
- **Middleware:** `backend/src/middleware/`
  - `authMiddleware.ts` — `protect`, `optionalProtect`
  - `roleMiddleware.ts` — `authorize(...roles)`
  - `onboardingMiddleware.ts` — enforces onboarding completion
- **Model:** `backend/src/models/User.ts`
- **Validators:** `backend/src/validators/content.validator.ts` (`registerSchema`, `loginSchema`)
- **Routes:** `backend/src/routes/authRoutes.ts`

---

## User Model Fields

```typescript
{
  name: string;           // required
  email: string;          // required, unique, lowercased
  password?: string;      // absent for Google-only users
  role: "student" | "instructor" | "admin";  // default: "student"
  googleId?: string;      // set on Google OAuth
  avatar?: string;
  onboardingCompleted: boolean;  // default: false
  bio?: string;           // max 500 chars
  headline?: string;      // max 120 chars
  interests?: string[];
  socialLinks?: { website?, linkedin?, twitter? };
  isActive: boolean;      // default: true — false = account disabled
}
```

---

## JWT Token

- Signed with `process.env.JWT_SECRET`, expires in **7 days**.
- Payload: `{ id: string, role: string }`
- Always check `JWT_SECRET` exists before signing.

```typescript
const token = sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
```

---

## Route Protection Middleware

### `protect` — requires valid JWT
Use on all authenticated endpoints.

```typescript
import { protect } from "../middleware/authMiddleware";
router.get("/me", protect, getMe);
```

### `optionalProtect` — attaches user if token present, never blocks
Use on public endpoints that behave differently for logged-in users (e.g., course browse).

```typescript
router.get("/courses", optionalProtect, listCourses);
```

### `authorize(...roles)` — role-based access control
Always chain **after** `protect`.

```typescript
import { authorize } from "../middleware/roleMiddleware";
router.post("/courses", protect, authorize("instructor", "admin"), createCourse);
```

Available roles: `"student"`, `"instructor"`, `"admin"`.

---

## Google OAuth Flow

The frontend sends a Google `access_token` (from `@react-oauth/google`) to:
`POST /api/auth/google`

The backend calls the Google userinfo endpoint, finds or creates the user, and returns a JWT. Google users have an empty `password` string and `googleId` set.

---

## Onboarding Flow

- All new users (email or Google) start with `onboardingCompleted: false`.
- The `onboardingMiddleware` can block access to protected resources until onboarding is complete.
- On completing onboarding, call `PATCH /api/auth/onboarding` which sets `onboardingCompleted: true` and saves role/interests.

---

## Disabled Accounts

- If `user.isActive === false`, `protect` middleware returns `401` and login returns `403`.
- Admins toggle `isActive` via the admin dashboard.

---

## Key Rules

- Never return the `password` field in any API response.
- Always normalize role on register: only `"instructor"` is accepted; all others default to `"student"`.
- Use `protect` + `authorize` together — never `authorize` alone.
- Wrap all auth controller logic in `try/catch` returning `{ message: "Server error" }` on 500.
