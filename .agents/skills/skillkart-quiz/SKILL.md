---
name: skillkart-quiz
description: Quiz and assessment system for SkillKart — quiz creation, student submission, scoring, and the quiz gate that blocks lesson completion.
---

# SkillKart Quiz Guidelines

Covers quiz CRUD for instructors, student submission and scoring, and the quiz gate that prevents lesson completion without passing.

---

## Overview

- **Controller:** `backend/src/controllers/course/quizController.ts`
- **Models:**
  - `backend/src/models/Quiz.ts` — quiz definition (questions + passing threshold)
  - `backend/src/models/QuizAttempt.ts` — student attempt record
- **Routes:** `backend/src/routes/quizRoutes.ts` (nested under `/api/lessons/:lessonId/quiz`)

---

## Quiz Model Fields

```typescript
{
  lesson: ObjectId;           // ref: Lesson, unique (one quiz per lesson)
  questions: [{
    question: string;
    options: string[];        // min 2 options
    correctAnswer: number;    // index into options[]
  }];
  passingPercentage: number;  // default: 60
}
```

## QuizAttempt Model Fields

```typescript
{
  user: ObjectId;    // ref: User
  lesson: ObjectId;  // ref: Lesson
  answers: number[]; // student's chosen option indices
  score: number;     // percentage, 0-100
  passed: boolean;
}
// Compound index: { user: 1, lesson: 1 }
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/lessons/:lessonId/quiz` | instructor/admin | Create or replace quiz |
| GET | `/api/lessons/:lessonId/quiz` | student | Get quiz (correctAnswer stripped) |
| POST | `/api/lessons/:lessonId/quiz/submit` | student | Submit answers, get score |

---

## Creating / Replacing a Quiz (`createOrReplaceQuiz`)

- Uses `Quiz.findOneAndUpdate` with `upsert: true` — one quiz per lesson, fully replaced on update.
- Validates each question: must have `question` string, `options` array (min 2), and valid `correctAnswer` index.
- Default `passingPercentage`: **60**.

---

## Getting a Quiz (`getQuiz`)

- **`correctAnswer` is stripped** from the response before sending to students.
- Also returns the student's **latest attempt** (`score`, `passed`, `createdAt`) so the frontend can show pass/fail state without a separate request.

```typescript
// Response shape:
{
  lessonId: string;
  passingPercentage: number;
  questions: [{ question, options }];  // no correctAnswer
  latestAttempt: { score, passed, createdAt } | null;
}
```

---

## Submitting a Quiz (`submitQuiz`)

```typescript
// Body: { answers: number[] }
// answers.length must equal quiz.questions.length
```

Scoring logic:
```typescript
let correct = 0;
for (let i = 0; i < quiz.questions.length; i++) {
  if (answers[i] === quiz.questions[i].correctAnswer) correct++;
}
const score = Math.round((correct / quiz.questions.length) * 100);
const passed = score >= quiz.passingPercentage;
```

A new `QuizAttempt` is created on every submission — attempts are **not** limited.

---

## Quiz Gate (in `progressController.ts`)

Before marking a lesson as complete, `updateLessonProgress` checks:

```typescript
const quiz = await Quiz.findOne({ lesson: lesson._id }).lean();
if (quiz) {
  const latestAttempt = await QuizAttempt.findOne(
    { user: req.user.id, lesson: lesson._id },
    { passed: 1 },
    { sort: { createdAt: -1 } }
  ).lean();
  if (!latestAttempt?.passed) {
    return res.status(403).json({
      message: "You must pass the quiz before marking this lesson complete",
    });
  }
}
```

This gate lives in `progressController.ts`, NOT in `quizController.ts`.

---

## Key Rules

- Never expose `correctAnswer` to students via the GET quiz endpoint.
- Multiple attempts are always allowed — always create a new `QuizAttempt` on submit.
- The quiz gate checks the **most recent** attempt only.
- If a lesson has no quiz, the gate is skipped entirely.
- Always validate that `answers.length === quiz.questions.length` before scoring.
