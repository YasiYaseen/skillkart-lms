import { Router } from "express";
import { protect, ensureNotMaintenance } from "../middleware/authMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";
import {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollment,
  updateProgress,
  cancelEnrollment
} from "../controllers/enrollment/enrollmentController";

const router = Router();

// IMPORTANT: /me must come before /:courseId/enrollment — Express matches top-to-bottom.
// Without this order, GET /enrollments/me would be captured by /:courseId/enrollment with courseId="me".
router.post("/", protect, ensureNotMaintenance, requireOnboardingCompleted, enrollInCourse);
router.get("/me", protect, requireOnboardingCompleted, getMyEnrollments);
router.get("/:courseId/enrollment", protect, requireOnboardingCompleted, getCourseEnrollment);
router.patch("/:id/progress", protect, ensureNotMaintenance, requireOnboardingCompleted, updateProgress);
router.delete("/:id", protect, ensureNotMaintenance, requireOnboardingCompleted, cancelEnrollment);

export default router;
