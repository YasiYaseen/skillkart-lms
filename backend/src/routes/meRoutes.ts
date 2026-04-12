import { Router } from "express";
import { getMyCourses } from "../controllers/course/enrollmentController.js";
import { getMyCourseProgress } from "../controllers/course/progressController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware.js";

const router = Router();

router.get("/courses", protect, requireOnboardingCompleted, getMyCourses);
router.get("/courses/:courseId/progress", protect, requireOnboardingCompleted, getMyCourseProgress);

export default router;
