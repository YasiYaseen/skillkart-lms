import { Router } from "express";
import { getInstructorAnalytics } from "../controllers/instructor/instructorAnalyticsController";
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

export default router;
