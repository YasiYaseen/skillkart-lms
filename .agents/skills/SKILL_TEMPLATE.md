---
name: skillkart-<feature-name>
description: One-line description of what this skill covers in SkillKart.
---

# SkillKart [Feature Name] Guidelines

Brief description of what this subsystem does and when agents should use this skill.

---

## Overview

- **Model Location:** `backend/src/models/FeatureName.ts`
- **Controller Location:** `backend/src/controllers/<domain>/featureController.ts`
- **Route Location:** `backend/src/routes/featureRoutes.ts`
- **Frontend Location:** `frontend/src/features/<domain>/components/`

---

## How It Works

Explain the core flow of this subsystem in plain language.

---

## Key Rules

- Rule 1 agents must always follow.
- Rule 2 agents must always follow.
- Wrap side effects (e.g., notifications) in `try/catch` so they do not block the main transaction.

---

## Code Example

```typescript
// Minimal working example of the most common operation in this subsystem
import Model from "../../models/Model";

await Model.create({
  field: value,
});
```

---

## Integration Points

List which other subsystems or controllers interact with this one:
- `progressController.ts` — triggers this after X condition.
- `NotificationModel` — fires a notification after this completes.

---

## Extending This Feature

Steps to safely extend or modify this subsystem:
1. Update the Mongoose schema in `backend/src/models/`.
2. Update the relevant controller(s).
3. Update the frontend component(s).
4. Update this SKILL.md with the new behaviour.
