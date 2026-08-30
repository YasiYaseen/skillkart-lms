---
name: skillkart-announcements
description: Course announcements system for SkillKart — instructor broadcasting, enrolled student notifications, and viewer components.
---

# SkillKart Announcements Guidelines

Instructions on how to manage and broadcast course announcements in the SkillKart LMS workspace.

---

## Overview

- **Model Location:** `backend/src/models/Announcement.ts`
- **Controller Location:** `backend/src/controllers/course/announcementController.ts`
- **Route Location:** `backend/src/routes/courseRoutes.ts` (`/api/courses/:courseId/announcements`)
- **Frontend Location:** `frontend/src/features/student/components/CourseAnnouncements.tsx` & `frontend/src/features/instructor/pages/Announcements.tsx`

---

## How It Works

1. Instructors create announcements attached to a course.
2. An announcement record is saved in MongoDB with author, title, and content.
3. Notifications are automatically triggered to all active enrolled students of the course in a non-blocking background promise.
4. Students can view announcements within the learning page tab and course view.

---

## Key Rules

- Only the instructor of the course or an admin can publish announcements (`authorize("instructor", "admin")`).
- Students actively enrolled in the course (or course instructor/admin) can view course announcements.
- Always wrap mass student notification creation in a `try/catch` block so notification delivery does not block the announcement creation response.

---

## Code Example

```typescript
import Announcement from "../../models/Announcement";
import Notification from "../../models/Notification";
import Enrollment from "../../models/Enrollment";

// Create announcement
const announcement = await Announcement.create({
  course: courseId,
  instructor: req.user.id,
  title,
  content,
});

// Broadcast in-app notifications to all active students
const enrollments = await Enrollment.find({ course: courseId, status: "active" }).select("student");
const notifications = enrollments.map((e) => ({
  recipient: e.student,
  title: `New Announcement: ${title}`,
  message: `Your instructor posted an announcement in the course.`,
  type: "info",
  link: `/learn/${courseId}`,
}));
if (notifications.length > 0) {
  await Notification.insertMany(notifications);
}
```

---

## Integration Points

- `announcementController.ts`: Dispatches in-app notifications on publication.
- `LessonViewer.tsx`: Contains the Course Announcements tab for students.
- `InstructorLayout`: Contains the Instructor Announcements Studio.
