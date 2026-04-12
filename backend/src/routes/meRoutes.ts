import { Router } from "express";
import { getMyCourses } from "../controllers/course/enrollmentController.js";
import { getMyCourseProgress } from "../controllers/course/progressController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/courses", protect, getMyCourses);
router.get("/courses/:courseId/progress", protect, getMyCourseProgress);

export default router;
