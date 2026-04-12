import { Router } from "express";
import { updateLesson } from "../controllers/course/lessonController.js";
import { createLessonItem } from "../controllers/course/lessonItemController.js";
import { updateLessonProgress } from "../controllers/course/progressController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware.js";

const router = Router();

router.patch("/:lessonId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), updateLesson);
router.post("/:lessonId/items", protect, requireOnboardingCompleted, authorize("instructor", "admin"), createLessonItem);
router.post(
  "/:lessonId/progress",
  protect,
  requireOnboardingCompleted,
  authorize("student", "instructor", "admin"),
  updateLessonProgress
);

export default router;
