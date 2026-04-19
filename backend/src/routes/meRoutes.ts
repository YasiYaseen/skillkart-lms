import { Router } from "express";
import { getMyEnrollments } from "../controllers/enrollment/enrollmentController";
import { getMyCourseProgress } from "../controllers/course/progressController";
import { protect } from "../middleware/authMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.get("/courses", protect, requireOnboardingCompleted, getMyEnrollments);
router.get("/courses/:courseId/progress", protect, requireOnboardingCompleted, getMyCourseProgress);

export default router;
