# Reviews and Ratings

Status: Review
Priority: MVP
Owner: Yaseen

## Goal
Let enrolled students give feedback on courses.

## Requirements
- Enrolled students can rate a course
- Enrolled students can write a review
- Show average course rating
- Show course reviews on course detail page
- Prevent multiple reviews from the same student for the same course

## Backend Scope
- Create review model
- Add create, update, and list review APIs
- Calculate average rating for courses

## Frontend Scope
- Add review form
- Show rating summary
- Show review list on course detail page

## Acceptance Checklist
- [x] Enrolled student can review course
- [x] Non-enrolled student cannot review course
- [x] Duplicate review is blocked
- [x] Average rating updates correctly

## Current Implementation Notes
- Implemented `Review` model with unique course/student reviews.
- Added `GET /api/courses/:courseId/reviews`, `POST /api/courses/:courseId/reviews`, and `PATCH /api/courses/:courseId/reviews/me`.
- Review creation is limited to onboarded students with active or completed enrollment.
- Course list and course detail responses include `averageRating` and `reviewCount`.
- Course cards and course detail pages now show real rating data.
- Course detail page includes review submission and review list UI.
