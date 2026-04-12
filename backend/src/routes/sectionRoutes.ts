import { Router } from "express";
import { createLesson } from "../controllers/course/lessonController.js";
import { updateSection, deleteSection } from "../controllers/course/sectionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware.js";

const router = Router();

router.patch("/:sectionId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), updateSection);
router.delete("/:sectionId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), deleteSection);
router.post("/:sectionId/lessons", protect, requireOnboardingCompleted, authorize("instructor", "admin"), createLesson);

export default router;
