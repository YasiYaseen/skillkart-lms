# Reviews and Ratings

Status: Not Started
Priority: MVP
Owner: Unassigned

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
- [ ] Enrolled student can review course
- [ ] Non-enrolled student cannot review course
- [ ] Duplicate review is blocked
- [ ] Average rating updates correctly

## Current Implementation Notes
- No review model, routes, controller, or real frontend review flow was found.
- Course cards currently show placeholder rating data.
