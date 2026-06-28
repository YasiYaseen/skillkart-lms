# Progress Tracking

Status: Done
Priority: MVP
Owner: Yaseen

## Goal
Track how much of a course each student has completed.

## Requirements
- Track completed lessons
- Calculate course completion percentage
- Save last accessed lesson
- Mark course as completed when all lessons are completed
- Show progress on student dashboard and course page

## Backend Scope
- Create progress model
- Add mark lesson complete API
- Add last accessed lesson tracking
- Add completion percentage calculation

## Frontend Scope
- Show progress bars
- Show last accessed lesson
- Update progress after lesson completion

## Acceptance Checklist
- [x] Completed lessons are saved
- [x] Progress percentage is accurate
- [x] Last accessed lesson is saved
- [x] Course becomes complete at 100 percent
- [x] Progress bar is shown on student dashboard and course card

## Current Implementation Notes
- Status: Fully complete.
- We have synchronized the progress updates across `LessonProgress` and `Enrollment` models.
- Fixed the `lastAccessedLessonId` schema attribute lookup bug.
- Consolidated the course auto-completion check logic inside `updateLessonProgress` to ensure completing all lessons marks the course enrollment as `"completed"` automatically.
- Keeping `LessonProgress` in sync when updates occur via enrollment patch updates as well.
