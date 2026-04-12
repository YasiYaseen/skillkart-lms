import { Router } from "express";
import { updateLesson } from "../controllers/course/lessonController.js";
import { createLessonItem } from "../controllers/course/lessonItemController.js";
import { updateLessonProgress } from "../controllers/course/progressController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

router.patch("/:lessonId", protect, authorize("instructor", "admin"), updateLesson);
router.post("/:lessonId/items", protect, authorize("instructor", "admin"), createLessonItem);
router.post("/:lessonId/progress", protect, authorize("student", "instructor", "admin"), updateLessonProgress);

export default router;
