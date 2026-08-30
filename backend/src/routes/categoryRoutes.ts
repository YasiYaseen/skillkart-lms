import { Router } from "express";
import {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category/categoryController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";

const router = Router();

// Public route: get active categories with live counts
router.get("/", getPublicCategories);

// Admin-only management routes
router.get("/admin/all", protect, authorize("admin"), getAdminCategories);
router.post("/admin", protect, authorize("admin"), createCategory);
router.put("/admin/:categoryId", protect, authorize("admin"), updateCategory);
router.delete("/admin/:categoryId", protect, authorize("admin"), deleteCategory);

export default router;
