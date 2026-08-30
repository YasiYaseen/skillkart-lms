import { Router } from "express";
import { getMyEnrollments } from "../controllers/enrollment/enrollmentController";
import { getMyCourseProgress } from "../controllers/course/progressController";
import {
  getCourseNotes,
  getAllUserNotes,
} from "../controllers/course/noteController";
import {
  getCourseBookmarks,
  getAllUserBookmarks,
} from "../controllers/course/bookmarkController";
import {
  getStudentStreak,
  getRecentlyViewedCourses,
  recordRecentlyViewedCourse,
} from "../controllers/user/userController";
import { protect } from "../middleware/authMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.get("/courses", protect, requireOnboardingCompleted, getMyEnrollments);
router.get("/courses/:courseId/progress", protect, requireOnboardingCompleted, getMyCourseProgress);

// Learning streak
router.get("/streak", protect, getStudentStreak);

// Recently viewed courses
router.get("/recently-viewed", protect, getRecentlyViewedCourses);
router.post("/recently-viewed/:courseId", protect, recordRecentlyViewedCourse);

// User study notes
router.get("/notes", protect, requireOnboardingCompleted, getAllUserNotes);
router.get("/courses/:courseId/notes", protect, requireOnboardingCompleted, getCourseNotes);

// User lesson bookmarks
router.get("/bookmarks", protect, requireOnboardingCompleted, getAllUserBookmarks);
router.get("/courses/:courseId/bookmarks", protect, requireOnboardingCompleted, getCourseBookmarks);

export default router;

