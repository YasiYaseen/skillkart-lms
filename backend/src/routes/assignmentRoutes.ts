import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import {
  getCourseAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getInstructorSubmissions,
  gradeSubmission,
} from "../controllers/assignmentController";

const router = Router();

// Student & Common Routes (All authenticated users / enrolled students)
router.get("/course/:courseId", protect, getCourseAssignments);
router.get("/:id", protect, getAssignmentById);
router.post("/:id/submit", protect, submitAssignment);

// Instructor / Admin Routes
router.get(
  "/instructor/submissions",
  protect,
  authorize("instructor", "admin"),
  getInstructorSubmissions
);

router.post(
  "/course/:courseId",
  protect,
  authorize("instructor", "admin"),
  createAssignment
);

router.put(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  updateAssignment
);

router.delete(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  deleteAssignment
);

router.put(
  "/submissions/:submissionId/grade",
  protect,
  authorize("instructor", "admin"),
  gradeSubmission
);

export default router;
