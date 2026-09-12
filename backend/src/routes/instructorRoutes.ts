import { Router } from "express";
import {
  getInstructorAnalytics,
  getInstructorStudents,
} from "../controllers/instructor/instructorAnalyticsController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

import {
  getInstructorEarnings,
  requestInstructorPayout,
  exportEarningsCsv,
} from "../controllers/instructor/instructorEarningsController";
import { getInstructorCourses } from "../controllers/course/courseController";

const router = Router();

router.get(
  "/courses",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  getInstructorCourses
);

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

router.get(
  "/earnings",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  getInstructorEarnings
);

router.post(
  "/payouts/request",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  requestInstructorPayout
);

router.get(
  "/earnings/export-csv",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  exportEarningsCsv
);

export default router;
