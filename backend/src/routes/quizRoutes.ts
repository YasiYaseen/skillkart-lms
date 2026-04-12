import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware.js";
import { createOrReplaceQuiz, getQuiz, submitQuiz } from "../controllers/course/quizController.js";

const router = Router();

// Instructor/admin: create or replace quiz
router.post(
  "/lessons/:lessonId/quiz",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  createOrReplaceQuiz
);

// Student: get quiz (no correct answers)
router.get("/lessons/:lessonId/quiz", protect, requireOnboardingCompleted, getQuiz);

// Student: submit answers
router.post("/lessons/:lessonId/quiz/submit", protect, requireOnboardingCompleted, submitQuiz);

export default router;
