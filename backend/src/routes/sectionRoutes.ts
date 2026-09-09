import { Router } from "express";
import { createLesson, reorderLessons } from "../controllers/course/lessonController";
import { updateSection, deleteSection } from "../controllers/course/sectionController";
import { bulkUploadLessons } from "../controllers/course/bulkLessonController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.patch("/:sectionId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), updateSection);
router.delete("/:sectionId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), deleteSection);
router.post("/:sectionId/lessons", protect, requireOnboardingCompleted, authorize("instructor", "admin"), createLesson);
router.patch(
  "/:sectionId/lessons/reorder",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  reorderLessons
);
router.post(
  "/:sectionId/lessons/bulk",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  bulkUploadLessons
);

export default router;

