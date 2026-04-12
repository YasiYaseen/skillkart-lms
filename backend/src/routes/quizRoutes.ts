import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createOrReplaceQuiz, getQuiz, submitQuiz } from "../controllers/course/quizController.js";

const router = Router();

// Instructor/admin: create or replace quiz
router.post(
  "/lessons/:lessonId/quiz",
  protect,
  authorize("instructor", "admin"),
  createOrReplaceQuiz
);

// Student: get quiz (no correct answers)
router.get("/lessons/:lessonId/quiz", protect, getQuiz);

// Student: submit answers
router.post("/lessons/:lessonId/quiz/submit", protect, submitQuiz);

export default router;
