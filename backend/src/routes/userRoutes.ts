import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getPublicInstructorProfile,
  getStudentStreak,
  getRecentlyViewedCourses,
  recordRecentlyViewedCourse,
} from "../controllers/user/userController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Profile endpoints (supports /profile and /me aliases)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

// Streak endpoint
router.get("/streak", protect, getStudentStreak);

// Recently viewed courses
router.get("/recently-viewed", protect, getRecentlyViewedCourses);
router.post("/recently-viewed/:courseId", protect, recordRecentlyViewedCourse);

// Public instructor profile
router.get("/instructor/:instructorId", getPublicInstructorProfile);

export default router;

