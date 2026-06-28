# Quiz and Assessment Basics

Status: Done
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
- [x] Instructor can create quiz
- [x] Student can submit quiz
- [x] Score is calculated correctly
- [x] Attempt is stored
- [x] Pass or fail status is shown to student after submission

## Current Implementation Notes
- Quiz and quiz attempt models exist.
- Quiz routes and controller exist in `backend/src/routes/quizRoutes.ts` and `backend/src/controllers/course/quizController.ts`.
- Frontend quiz component exists at `frontend/src/components/LessonQuiz.tsx`.
- Instructor Quiz Creation UI added via `QuizEditorModal.tsx` in the course builder (`CreateCourse.tsx`).
- Pass/Fail status is correctly shown to students after submitting their quiz.
- Feature is complete.
