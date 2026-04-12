import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Quiz from "../../models/Quiz";
import QuizAttempt from "../../models/QuizAttempt";
import Lesson from "../../models/Lesson";

function normalizeParam(param: string | string[] | undefined): string | null {
  if (!param) return null;
  return Array.isArray(param) ? param[0] : param;
}

// POST /api/lessons/:lessonId/quiz  (instructor/admin only)
export async function createOrReplaceQuiz(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const lessonId = normalizeParam(req.params.lessonId);
    if (!lessonId || !isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const { questions, passingPercentage } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    for (const q of questions) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer >= q.options.length
      ) {
        return res.status(400).json({ message: "Invalid question format" });
      }
    }

    const quiz = await Quiz.findOneAndUpdate(
      { lesson: lessonId },
      {
        lesson: lessonId,
        questions,
        passingPercentage: passingPercentage ?? 60,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Quiz saved", quiz });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/lessons/:lessonId/quiz  (student - no correctAnswer)
export async function getQuiz(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const lessonId = normalizeParam(req.params.lessonId);
    if (!lessonId || !isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const quiz = await Quiz.findOne({ lesson: lessonId }).lean();
    if (!quiz) return res.status(404).json({ message: "No quiz for this lesson" });

    // Strip correctAnswer before sending
    const safeQuestions = quiz.questions.map(({ question, options }) => ({
      question,
      options,
    }));

    // Also send latest attempt for this user so frontend can show state
    const latestAttempt = await QuizAttempt.findOne(
      { user: req.user.id, lesson: lessonId },
      { score: 1, passed: 1, createdAt: 1 },
      { sort: { createdAt: -1 } }
    ).lean();

    return res.json({
      lessonId,
      passingPercentage: quiz.passingPercentage,
      questions: safeQuestions,
      latestAttempt: latestAttempt ?? null,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/lessons/:lessonId/quiz/submit  (student)
export async function submitQuiz(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const lessonId = normalizeParam(req.params.lessonId);
    if (!lessonId || !isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const quiz = await Quiz.findOne({ lesson: lessonId });
    if (!quiz) return res.status(404).json({ message: "No quiz for this lesson" });

    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: `Expected ${quiz.questions.length} answers, got ${answers?.length ?? 0}`,
      });
    }

    let correct = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].correctAnswer) correct++;
    }

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passingPercentage;

    await QuizAttempt.create({
      user: req.user.id,
      lesson: lessonId,
      answers,
      score,
      passed,
    });

    return res.json({ score, passed, passingPercentage: quiz.passingPercentage });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
