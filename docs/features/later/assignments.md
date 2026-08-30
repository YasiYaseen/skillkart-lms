# Course Assignments & Gradebook

Status: Done
Priority: Later
Owner: Implemented

## Goal
Enable instructors to assign practical projects and coursework with custom rubric criteria, and allow enrolled students to submit deliverables (files, URLs, or text) with instructor scoring and feedback.

## Requirements
- Instructors can create, update, and delete course assignments with rich instructions, due dates, attachments, and custom rubric criteria.
- Enrolled students can view assignments in the course viewer and submit deliverables via file upload, external link, or text.
- Instructors can review submissions, evaluate criteria using the interactive rubric scoring interface, provide qualitative feedback, assign final scores, and update submission status (`under_review`, `graded`, `resubmission_requested`).
- Automated in-app notifications notify students of new assignments and grading updates, and instructors of new student submissions.

## Acceptance Checklist
- [x] Instructor can define assignment with title, description, max score, due date, and rubric
- [x] Enrolled student can view assignments in `LessonViewer` and submit work
- [x] Instructor can view all submissions in gradebook, evaluate rubric, and post feedback
- [x] In-app notifications triggered for assignment creation, student submission, and grade publication
