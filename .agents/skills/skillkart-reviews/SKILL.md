---
name: skillkart-reviews
description: Course reviews and ratings system for SkillKart — creating, updating, and aggregating star ratings with enrollment gating.
---

# SkillKart Reviews & Ratings Guidelines

Covers creating and updating course reviews, rating aggregation, and the enrollment gate.

---

## Overview

- **Controller:** `backend/src/controllers/course/reviewController.ts`
- **Model:** `backend/src/models/Review.ts`
- **Validator:** `backend/src/validators/review.validator.ts`
- **Routes:** nested under `backend/src/routes/courseRoutes.ts`

---

## Review Model Fields

```typescript
{
  course: ObjectId;   // ref: Course
  student: ObjectId;  // ref: User
  rating: number;     // 1-5
  comment?: string;
}
// Compound index: { course: 1, student: 1 } unique — one review per student per course
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/courses/:courseId/reviews?sort=newest\|highest\|lowest&page=1&limit=10` | public | List reviews (with sorting and pagination) + rating summary |
| POST | `/api/courses/:courseId/reviews` | student | Create a review |
| PUT | `/api/courses/:courseId/reviews` | student | Update own review |
| PATCH | `/api/courses/:courseId/reviews/me` | student | Update own review |
| DELETE | `/api/courses/:courseId/reviews/me` | student | Delete own review |

---

## Rating Aggregation & Querying (`listCourseReviews`)

Supports query parameters:
- `sort`: `"newest"` (default), `"highest"`, or `"lowest"`
- `page`: integer page (default `1`)
- `limit`: items per page (default `10`, max `50`)

Always computed via MongoDB aggregation — never stored on the Course document directly:

```typescript
const [summary] = await Review.aggregate([
  { $match: { course: new Types.ObjectId(courseId) } },
  {
    $group: {
      _id: "$course",
      averageRating: { $avg: "$rating" },
      reviewCount: { $sum: 1 },
    },
  },
]);
// averageRating is rounded to 1 decimal place
```

The `listCourseReviews` response returns:
```typescript
{
  averageRating: number;  // e.g. 4.3
  reviewCount: number;
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}
```

---

## Enrollment Gate (`canReviewCourse`)

Only students with an **active** or **completed** enrollment can create or update a review:

```typescript
const enrollment = await Enrollment.findOne({
  course: courseId,
  student: studentId,
  status: { $in: ["active", "completed"] },
});
return Boolean(enrollment);
```

Returns `403` if the student is not enrolled.

---

## One Review Per Student

- `Review.exists({ course, student })` is checked before creation.
- Returns `409 Conflict` if a review already exists.
- To change a review, use the PUT endpoint (updates in place).

---

## Notification on New Review

When a student posts a review, the **instructor** is notified:

```typescript
await Notification.create({
  recipient: courseObj.instructor,
  title: "New Course Review",
  message: `A student left a ${rating}-star review on "${courseObj.title}".`,
  type: "info",
  link: `/courses/${courseId}`,
});
```

Wrap this in the same `try/catch` as the review creation.

---

## Key Rules

- Only **published** courses can receive reviews — check `course.status === "published"`.
- `averageRating` is always computed fresh from aggregation, never cached on Course model.
- Always return the updated `summary` object alongside the review in POST/PUT responses.
- The enrollment gate must be checked on both create AND update.
