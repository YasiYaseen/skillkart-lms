import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import {
  getStats,
  getAdminSidebarBadges,
  getUsers,
  toggleUserStatus,
  updateUserRole,
  getPendingInstructors,
  bulkApproveInstructors,
  getCourses,
  updateCourseStatus,
  getEnrollments,
  getAuditLogs,
  getFinancialReports,
  exportFinancialsCsv,
  getPayoutRequests,
  updatePayoutStatus,
  exportPayoutsCsv,
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
router.get("/course-generator/presets", getCoursePresets);
router.post("/generate-courses", generateAdminCourses);
router.post("/course-generator/generate", generateAdminCourses);

router.get("/stats", getStats);
router.get("/sidebar-badges", getAdminSidebarBadges);

router.get("/financial-reports", getFinancialReports);
router.get("/financial-reports/export-csv", exportFinancialsCsv);

router.get("/payouts", getPayoutRequests);
router.patch("/payouts/:payoutId/status", updatePayoutStatus);
router.get("/payouts/export-csv", exportPayoutsCsv);

router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);
router.post("/settings/test-email", testEmailDiagnostics);

router.get("/users", getUsers);
router.patch("/users/:userId/status", toggleUserStatus);
router.patch("/users/:userId/role", updateUserRole);

router.get("/instructor-reviews", getPendingInstructors);
router.post("/instructor-reviews/bulk", bulkApproveInstructors);

router.get("/courses", getCourses);
router.patch("/courses/:courseId/status", updateCourseStatus);
router.patch("/courses/:courseId/moderation", updateCourseStatus);

router.get("/enrollments", getEnrollments);

router.get("/audit-logs", getAuditLogs);

export default router;
