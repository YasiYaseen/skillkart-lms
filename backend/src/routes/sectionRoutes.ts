import { Router } from "express";
import { createLesson } from "../controllers/course/lessonController.js";
import { updateSection, deleteSection } from "../controllers/course/sectionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

router.patch("/:sectionId", protect, authorize("instructor", "admin"), updateSection);
router.delete("/:sectionId", protect, authorize("instructor", "admin"), deleteSection);
router.post("/:sectionId/lessons", protect, authorize("instructor", "admin"), createLesson);

export default router;
