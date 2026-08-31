import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import {
  getFeaturedCoupons,
  validateCoupon,
  createCoupon,
  getInstructorCoupons,
  getAdminCoupons,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController";

const router = Router();

// Public: Featured active public coupons for CartPage
router.get("/featured", getFeaturedCoupons);

// Public / Student: Validate coupon code against a cart
router.post("/validate", validateCoupon);

// Admin only: Fetch all platform & instructor coupons
router.get("/admin", protect, authorize("admin"), getAdminCoupons);

// Instructor / Admin Protected Routes
router.get("/mine", protect, authorize("instructor", "admin"), getInstructorCoupons);
router.post("/", protect, authorize("instructor", "admin"), createCoupon);
router.put("/:id", protect, authorize("instructor", "admin"), updateCoupon);
router.delete("/:id", protect, authorize("instructor", "admin"), deleteCoupon);

export default router;

