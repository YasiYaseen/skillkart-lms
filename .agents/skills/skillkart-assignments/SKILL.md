---
name: skillkart-assignments
description: Course assignments and hands-on project grading system for SkillKart — rubric criteria, student submissions (files, URLs, text), instructor gradebook, and feedback.
---

# SkillKart Assignments & Gradebook Guidelines

Instructions on how to manage practical assignments, student project submissions, rubrics, and instructor grading workflows in SkillKart.

---

## Overview

- **Models:**
  - `backend/src/models/Assignment.ts` (Assignment brief, instructions, maxScore, rubrics, starter attachments)
  - `backend/src/models/AssignmentSubmission.ts` (Student deliverable, fileUrl, externalLink, studentNote, score, rubric breakdown, instructorFeedback, status)
- **Controller:** `backend/src/controllers/assignmentController.ts`
- **Validators:** `backend/src/validators/assignmentValidator.ts`
- **Routes:** `backend/src/routes/assignmentRoutes.ts` (mounted under `/api/assignments`)
- **Frontend Student Tab:** `frontend/src/features/student/components/CourseAssignmentsTab.tsx` (integrated into `LessonViewer.tsx`)
- **Frontend Instructor Page:** `frontend/src/features/instructor/pages/Assignments.tsx` (accessible at `/instructor/assignments`)

---

## Key Workflows

### 1. Instructor Creates / Edits Assignment
- Instructors define title, description, detailed instructions, max score, optional due date, starter file attachments, and custom rubric criteria (e.g., *Core Functionality - 50 pts*, *Code Quality - 30 pts*).
- An in-app notification is fired to all actively enrolled students.

### 2. Student Submits Project
- Enrolled students submit their coursework via file upload (ZIP, PDF, DOCX), external URL (GitHub, Figma, CodeSandbox), or text response.
- An in-app notification is dispatched to the course instructor.

### 3. Instructor Evaluates & Grades
- In `/instructor/assignments` (Gradebook tab), instructors filter submissions by course or review status.
- Instructors evaluate deliverables with rubric scoring, total score assignment, status updates (*Graded*, *Under Review*, *Resubmission Requested*), and written feedback.
- An in-app notification is dispatched to the student with their score summary.
