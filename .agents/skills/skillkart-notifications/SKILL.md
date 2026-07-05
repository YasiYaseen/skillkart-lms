---
name: skillkart-notifications
description: Instructions on how to trigger and manage in-app notifications in the SkillKart LMS workspace.
---

# SkillKart Notifications Guidelines

This skill explains how to interact with the Notification system in the SkillKart workspace.

## Triggering a Notification

When you implement a new feature that requires notifying a user (e.g., student, instructor), use the `Notification` model to create a notification record in the database.

**Model Location:** `backend/src/models/Notification.ts`

### Example Usage

```typescript
import Notification from "../../models/Notification";

// Triggering a notification
await Notification.create({
  recipient: userId, // ObjectId of the user receiving the notification
  title: "Short, descriptive title",
  message: "Detailed message describing the event.",
  type: "info", // "info", "success", or "warning"
  link: "/path/to/relevant/page", // Optional: relative URL for the frontend
});
```

## Supported Notification Types
- `info`: General updates (e.g., "New student enrolled").
- `success`: Positive achievements (e.g., "Course completed", "Enrollment successful").
- `warning`: Important alerts or errors.

## Adding New Notification Triggers
If you are adding a new trigger:
1. Identify the appropriate controller (e.g., `courseController`, `enrollmentController`).
2. Import the `Notification` model.
3. Fire the `Notification.create()` asynchronously after the primary database transaction is successful.

## Frontend
The frontend displays notifications via the `NotificationBell` component located at `frontend/src/components/common/NotificationBell.tsx`. It polls the `/api/notifications` endpoint.
