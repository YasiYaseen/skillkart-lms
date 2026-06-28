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
} from "../controllers/course/courseController";
import { createSection } from "../controllers/course/sectionController";
import {
  getCurriculumForCourse,
} from "../controllers/course/enrollmentController";
import { getCourseStudents } from "../controllers/enrollment/enrollmentController";
import {
  createCourseReview,
  listCourseReviews,
  updateCourseReview,
} from "../controllers/course/reviewController";
import { protect, optionalProtect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.get("/", optionalProtect, getCourses);
router.get("/:courseId", optionalProtect, getCourseById);
router.get("/:courseId/curriculum", optionalProtect, getCurriculumForCourse);
router.get("/:courseId/reviews", listCourseReviews);
router.post("/:courseId/reviews", protect, requireOnboardingCompleted, authorize("student"), createCourseReview);
router.patch("/:courseId/reviews/me", protect, requireOnboardingCompleted, authorize("student"), updateCourseReview);

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

router.get(
  "/:courseId/students",
  protect,
  requireOnboardingCompleted,
  authorize("instructor", "admin"),
  getCourseStudents
);

export default router;
