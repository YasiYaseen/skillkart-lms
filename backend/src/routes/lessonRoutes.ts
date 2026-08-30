import { Router } from "express";
import { updateLesson, deleteLesson } from "../controllers/course/lessonController";
import { createLessonItem } from "../controllers/course/lessonItemController";
import { updateLessonProgress } from "../controllers/course/progressController";
import {
  getLessonComments,
  createLessonComment,
  deleteLessonComment,
} from "../controllers/course/commentController";
import {
  getLessonNotes,
  createLessonNote,
} from "../controllers/course/noteController";
import {
  getLessonBookmarkStatus,
  toggleLessonBookmark,
} from "../controllers/course/bookmarkController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.patch("/:lessonId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), updateLesson);
router.delete("/:lessonId", protect, requireOnboardingCompleted, authorize("instructor", "admin"), deleteLesson);
router.post("/:lessonId/items", protect, requireOnboardingCompleted, authorize("instructor", "admin"), createLessonItem);
router.post(
  "/:lessonId/progress",
  protect,
  requireOnboardingCompleted,
  authorize("student", "instructor", "admin"),
  updateLessonProgress
);

// Lesson Comments / Discussion
router.get("/:lessonId/comments", protect, getLessonComments);
router.post("/:lessonId/comments", protect, requireOnboardingCompleted, createLessonComment);
router.delete("/:lessonId/comments/:commentId", protect, requireOnboardingCompleted, deleteLessonComment);

// Lesson Notes
router.get("/:lessonId/notes", protect, getLessonNotes);
router.post("/:lessonId/notes", protect, requireOnboardingCompleted, createLessonNote);

// Lesson Bookmarks
router.get("/:lessonId/bookmark", protect, getLessonBookmarkStatus);
router.post("/:lessonId/bookmark", protect, requireOnboardingCompleted, toggleLessonBookmark);

export default router;

