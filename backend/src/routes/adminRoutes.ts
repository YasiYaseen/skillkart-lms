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
  getAuditLogs,
  getFinancialReports,
  exportFinancialsCsv,
} from "../controllers/admin/adminController";
import {
  getAdminSettings,
  updateAdminSettings,
  testEmailDiagnostics,
} from "../controllers/admin/adminSettingsController";
import {
  getCoursePresets,
  generateAdminCourses,
} from "../controllers/admin/adminGeneratorController";

const router = Router();

// All routes here require the user to be authenticated and have the 'admin' role
router.use(protect, authorize("admin"));

router.get("/course-presets", getCoursePresets);
router.post("/generate-courses", generateAdminCourses);

router.get("/stats", getStats);

router.get("/financial-reports", getFinancialReports);
router.get("/financial-reports/export-csv", exportFinancialsCsv);

router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);
router.post("/settings/test-email", testEmailDiagnostics);

router.get("/users", getUsers);
router.patch("/users/:userId/status", toggleUserStatus);

router.get("/courses", getCourses);
router.patch("/courses/:courseId/status", updateCourseStatus);

router.get("/enrollments", getEnrollments);

router.get("/audit-logs", getAuditLogs);

export default router;
