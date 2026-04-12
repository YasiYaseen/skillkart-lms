import { Router } from "express";
import { updateLesson } from "../controllers/course/lessonController";
import { createLessonItem } from "../controllers/course/lessonItemController";
import { updateLessonProgress } from "../controllers/course/progressController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

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
