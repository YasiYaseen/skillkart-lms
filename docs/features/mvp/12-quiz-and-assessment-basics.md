# Quiz and Assessment Basics

Status: Pending
Priority: MVP
Owner: Unassigned

## Goal
Add basic assessments so courses can test student understanding.

## Requirements
- Instructor can create quizzes for a course or lesson
- Quiz supports multiple-choice questions
- Students can submit answers
- System calculates score
- Show pass or fail status
- Store quiz attempts

## Backend Scope
- Create quiz, question, and quiz attempt models
- Add quiz CRUD APIs for instructors
- Add quiz submission API for students

## Frontend Scope
- Build quiz editor
- Build quiz taking page
- Show quiz results

## Acceptance Checklist
- [ ] Instructor can create quiz
- [x] Student can submit quiz
- [x] Score is calculated correctly
- [x] Attempt is stored
- [ ] Pass or fail status is shown to student after submission

## Current Implementation Notes
- Quiz and quiz attempt models exist.
- Quiz routes and controller exist in `backend/src/routes/quizRoutes.ts` and `backend/src/controllers/course/quizController.ts`.
- Frontend quiz component exists at `frontend/src/components/LessonQuiz.tsx`.
- Missing or unclear: instructor quiz creation UI inside the course builder.
- Not defined: whether students can retake a quiz and how multiple attempts are handled.
