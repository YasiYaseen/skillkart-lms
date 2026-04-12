import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  unpublishCourse,
  archiveCourse,
  deleteCourse,
} from "../controllers/course/courseController.js";
import { createSection } from "../controllers/course/sectionController.js";
import {
  enrollInCourse,
  getCourseEnrollments,
  getCurriculumForCourse,
} from "../controllers/course/enrollmentController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware.js";

const router = Router();

router.get("/", optionalProtect, getCourses);
router.get("/:courseId", optionalProtect, getCourseById);
router.get("/:courseId/curriculum", optionalProtect, getCurriculumForCourse);

router.post("/", protect, requireOnboardingCompleted, authorize("instructor", "admin"), createCourse);
router.patch("/:courseId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), updateCourse);
router.patch(
  "/:courseId/publish",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  publishCourse
);
router.patch(
  "/:courseId/unpublish",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  unpublishCourse
);
router.patch(
  "/:courseId/archive",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  archiveCourse
);
router.delete("/:courseId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), deleteCourse);

router.post(
  "/:courseId/sections",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  createSection
);

router.post(
  "/:courseId/enroll",
  protect,
  requireOnboardingCompleted,
  authorize("student", "instructor", "admin"),
  enrollInCourse
);
router.get(
  "/:courseId/enrollments",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  getCourseEnrollments
);

export default router;
