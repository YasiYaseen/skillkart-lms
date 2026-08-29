import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import {
  getStats,
  getUsers,
  toggleUserStatus,
  getCourses,
  updateCourseStatus,
  getEnrollments,
} from "../controllers/admin/adminController";

const router = Router();

// All routes here require the user to be authenticated and have the 'admin' role
router.use(protect, authorize("admin"));

router.get("/stats", getStats);

router.get("/users", getUsers);
router.patch("/users/:userId/status", toggleUserStatus);

router.get("/courses", getCourses);
router.patch("/courses/:courseId/status", updateCourseStatus);

router.get("/enrollments", getEnrollments);

export default router;
