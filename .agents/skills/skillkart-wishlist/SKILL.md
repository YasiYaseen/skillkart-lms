---
name: skillkart-wishlist
description: Wishlist system for SkillKart — adding, removing, and listing wishlisted courses with enriched rating and enrollment data.
---

# SkillKart Wishlist Guidelines

Covers the student wishlist: adding courses, removing them, checking status, and the enriched list response.

---

## Overview

- **Controller:** `backend/src/controllers/wishlist/wishlistController.ts`
- **Model:** `backend/src/models/Wishlist.ts`
- **Validator:** `backend/src/validators/wishlistValidator.ts`
- **Routes:** `backend/src/routes/wishlistRoutes.ts`

---

## Wishlist Model Fields

```typescript
{
  student: ObjectId;  // ref: User
  course: ObjectId;   // ref: Course
}
// Compound index: { student: 1, course: 1 } unique — idempotent via $setOnInsert
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/wishlist` | student | Get wishlist with enriched course data |
| POST | `/api/wishlist` | student | Add course to wishlist |
| DELETE | `/api/wishlist/:courseId` | student | Remove course from wishlist |
| GET | `/api/wishlist/:courseId/status` | student | Check if course is wishlisted |

---

## Adding to Wishlist (idempotent)

Uses `$setOnInsert` to avoid duplicates:

```typescript
await Wishlist.findOneAndUpdate(
  { student: req.user.id, course: courseId },
  { $setOnInsert: { student: req.user.id, course: courseId } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
```

Only **published, active, and approved** courses can be wishlisted:
```typescript
if (course.status !== "published" || course.isActive === false || course.isApproved === false) {
  return res.status(400).json({ message: "Cannot wishlist unavailable course" });
}
```

---

## Enriched Wishlist Response

The GET wishlist endpoint enriches each item with live rating and enrollment data:

```typescript
// For each wishlist item:
const [ratingSummary, enrollmentCount] = await Promise.all([
  getCourseRatingSummary(courseId),  // aggregation on Review collection
  Enrollment.countDocuments({ course: courseId }),
]);

// Returns:
{
  wishlist: [{
    _id: string;
    createdAt: Date;
    course: {
      ...courseFields,
      averageRating: number;
      reviewCount: number;
      enrollmentCount: number;
    };
  }]
}
```

Filter out `null` course entries (deleted courses) before enriching.

---

## Key Rules

- Wishlist add is always idempotent — never throw a conflict error if already wishlisted.
- Always filter out null-course wishlist items before returning.
- The rating summary aggregation here is a copy of the one in `reviewController.ts` — if you refactor, extract it to a shared utility.
- No notifications are fired for wishlist actions.
