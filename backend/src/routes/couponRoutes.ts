import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import {
  validateCoupon,
  createCoupon,
  getInstructorCoupons,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController";

const router = Router();

// Public / Student: Validate coupon code against a cart
router.post("/validate", validateCoupon);

// Instructor / Admin Protected Routes
router.get("/mine", protect, authorize("instructor", "admin"), getInstructorCoupons);
router.post("/", protect, authorize("instructor", "admin"), createCoupon);
router.put("/:id", protect, authorize("instructor", "admin"), updateCoupon);
router.delete("/:id", protect, authorize("instructor", "admin"), deleteCoupon);

export default router;
