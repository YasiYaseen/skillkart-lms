import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";
import { createOrReplaceQuiz, getQuiz, submitQuiz, deleteQuiz } from "../controllers/course/quizController";

const router = Router();

// Instructor/admin: create or replace quiz
router.post(
  "/lessons/:lessonId/quiz",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  createOrReplaceQuiz
);

// Instructor/admin: delete quiz
router.delete(
  "/lessons/:lessonId/quiz",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  deleteQuiz
);

// Student: get quiz (no correct answers)
router.get("/lessons/:lessonId/quiz", protect, requireOnboardingCompleted, getQuiz);

// Student: submit answers
router.post("/lessons/:lessonId/quiz/submit", protect, requireOnboardingCompleted, submitQuiz);

export default router;
