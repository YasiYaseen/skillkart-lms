# Learning Page

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Provide the actual lesson-taking experience for enrolled students.

## Requirements
- Course player or lesson view
- Sidebar lesson list
- Previous and next lesson navigation
- Mark lesson as completed
- Show completed lesson state
- Continue course button
- Restrict course content to enrolled students

## Backend Scope
- Add API to fetch course content for enrolled students
- Add permission checks for enrollment
- Add endpoint to mark lesson complete

## Frontend Scope
- Build course learning page
- Add lesson sidebar
- Add lesson content viewer
- Add previous, next, and complete actions

## Acceptance Checklist
- [x] Enrolled student can view lessons
- [x] Non-enrolled student cannot view private content
- [x] Previous and next navigation works
- [x] Completed lessons show visual state

## Current Implementation Notes
- Learning page exists at `frontend/src/features/student/pages/LessonViewer.tsx`.
- Lesson sidebar, content rendering, previous/next navigation, quiz rendering, and progress action exist.
- Fixed: `getCourseById` now checks enrollment or instructor status before returning `lessonItems`, so private content is protected.
- Performance: Split into two `useEffect` hooks — course structure is fetched once on `courseId` change, while progress is fetched on each lesson navigation. This eliminates redundant full-course API calls when navigating between lessons.
- Feature is fully complete.
