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

const router = Router();

router.get("/", optionalProtect, getCourses);
router.get("/:courseId", optionalProtect, getCourseById);
router.get("/:courseId/curriculum", optionalProtect, getCurriculumForCourse);

router.post("/", protect, authorize("instructor", "admin"), createCourse);
router.patch("/:courseId", protect, authorize("instructor", "admin"), updateCourse);
router.patch("/:courseId/publish", protect, authorize("instructor", "admin"), publishCourse);
router.patch("/:courseId/unpublish", protect, authorize("instructor", "admin"), unpublishCourse);
router.patch("/:courseId/archive", protect, authorize("instructor", "admin"), archiveCourse);
router.delete("/:courseId", protect, authorize("instructor", "admin"), deleteCourse);

router.post("/:courseId/sections", protect, authorize("instructor", "admin"), createSection);

router.post("/:courseId/enroll", protect, authorize("student", "instructor", "admin"), enrollInCourse);
router.get("/:courseId/enrollments", protect, authorize("instructor", "admin"), getCourseEnrollments);

export default router;
