import { Router } from "express";
import {
  getInstructorAnalytics,
  getInstructorStudents,
} from "../controllers/instructor/instructorAnalyticsController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.get(
  "/analytics",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  getInstructorAnalytics
);

router.get(
  "/students",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  getInstructorStudents
);

export default router;
