# Progress Tracking

Status: In Progress
Priority: MVP
Owner: Unassigned

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
- [ ] Last accessed lesson is saved
- [ ] Course becomes complete at 100 percent
- [ ] Progress bar is shown on student dashboard and course card

## Current Implementation Notes
- There are two progress paths: `PATCH /api/enrollments/:id/progress` updates `Enrollment`, while `POST /api/lessons/:lessonId/progress` updates `LessonProgress`.
- The frontend learning page currently uses `POST /api/lessons/:lessonId/progress`.
- Bug: `progressController` writes `enrollment.last_lesson_id`, but the `Enrollment` schema field is `lastAccessedLessonId` — this will silently fail to save last accessed lesson.
- Bug: Course completion status update is implemented in the enrollment progress path, but not in the lesson progress path currently used by the learning UI. Completing all lessons will not mark the course as done.
- Recommendation: consolidate into one progress path or keep them in sync.
