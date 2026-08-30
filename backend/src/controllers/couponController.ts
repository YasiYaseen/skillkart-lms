import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Coupon from "../models/Coupon";
import Course from "../models/Course";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "../validators/couponValidator";

function getParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

// ---------------------------------------------------------------------------
// POST /api/coupons/validate
// Validates a coupon against a list of course IDs and calculates savings
// ---------------------------------------------------------------------------
export async function validateCoupon(req: Request, res: Response) {
  try {
    const parsed = validateCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid coupon validation payload",
        errors: parsed.error.flatten(),
      });
    }

    const { code, courseIds } = parsed.data;
    const validCourseIds = courseIds.filter((id) => isValidObjectId(id));
    if (validCourseIds.length === 0) {
      return res.status(400).json({ message: "No valid courses provided" });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    }).lean();

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or inactive promo coupon code." });
    }

    // Expiry check
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: "This coupon code has expired." });
    }

    // Redemption limit check
    if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
      return res.status(400).json({ message: "This coupon has reached its maximum redemption limit." });
    }

    // Fetch courses in cart
    const courses = await Course.find({ _id: { $in: validCourseIds } })
      .select("_id title price isPaid")
      .lean();

    let subtotal = 0;
    courses.forEach((c) => {
      const p = typeof c.price === "number" ? c.price : 0;
      subtotal += p;
    });

    // Minimum purchase check
    if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        message: `This coupon requires a minimum purchase order of $${coupon.minPurchaseAmount}.`,
      });
    }

    let discountTotal = 0;

    if (coupon.course) {
      // Course-specific coupon
      const targetCourse = courses.find((c) => c._id.toString() === coupon.course?.toString());
      if (!targetCourse) {
        return res.status(400).json({
          message: "This coupon is only valid for a specific course not in your cart.",
        });
      }
      const coursePrice = typeof targetCourse.price === "number" ? targetCourse.price : 0;
      if (coupon.discountType === "percentage") {
        discountTotal = (coursePrice * coupon.discountValue) / 100;
      } else {
        discountTotal = Math.min(coursePrice, coupon.discountValue);
      }
    } else {
      // Global cart-wide coupon
      if (coupon.discountType === "percentage") {
        discountTotal = (subtotal * coupon.discountValue) / 100;
      } else {
        discountTotal = Math.min(subtotal, coupon.discountValue);
      }
    }

    // Cap at max discount if defined
    if (coupon.maxDiscountAmount && discountTotal > coupon.maxDiscountAmount) {
      discountTotal = coupon.maxDiscountAmount;
    }

    discountTotal = Math.round(discountTotal * 100) / 100;
    const totalAmount = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

    return res.json({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description:
          coupon.discountType === "percentage"
            ? `${coupon.discountValue}% OFF`
            : `$${coupon.discountValue} OFF`,
      },
      subtotal,
      discountTotal,
      totalAmount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error validating coupon" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/coupons/mine
// Instructor/Admin fetches their created coupons
// ---------------------------------------------------------------------------
export async function getInstructorCoupons(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const filter: Record<string, unknown> = {};
    if (req.user.role !== "admin") {
      filter.instructor = req.user.id;
    }

    const coupons = await Coupon.find(filter)
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ coupons });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching coupons" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/coupons
// Instructor/Admin creates a new coupon
// ---------------------------------------------------------------------------
export async function createCoupon(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = createCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await Coupon.findOne({ code: parsed.data.code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Coupon code "${parsed.data.code}" already exists.` });
    }

    let courseRef: Types.ObjectId | undefined;
    if (parsed.data.courseId && isValidObjectId(parsed.data.courseId)) {
      courseRef = new Types.ObjectId(parsed.data.courseId);
    }

    const coupon = await Coupon.create({
      code: parsed.data.code.toUpperCase(),
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      course: courseRef,
      instructor: req.user.id,
      minPurchaseAmount: parsed.data.minPurchaseAmount || 0,
      maxDiscountAmount: parsed.data.maxDiscountAmount || undefined,
      maxRedemptions: parsed.data.maxRedemptions || undefined,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      isActive: true,
    });

    return res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (error) {
    return res.status(500).json({ message: "Server error creating coupon" });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/coupons/:id
// ---------------------------------------------------------------------------
export async function updateCoupon(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = getParam(req.params.id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (req.user.role !== "admin" && coupon.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = updateCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    if (parsed.data.code) coupon.code = parsed.data.code.toUpperCase();
    if (parsed.data.discountType) coupon.discountType = parsed.data.discountType;
    if (parsed.data.discountValue !== undefined) coupon.discountValue = parsed.data.discountValue;
    if (parsed.data.courseId !== undefined) {
      coupon.course = parsed.data.courseId && isValidObjectId(parsed.data.courseId)
        ? new Types.ObjectId(parsed.data.courseId)
        : undefined;
    }
    if (parsed.data.minPurchaseAmount !== undefined) coupon.minPurchaseAmount = parsed.data.minPurchaseAmount;
    if (parsed.data.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = parsed.data.maxDiscountAmount || undefined;
    }
    if (parsed.data.maxRedemptions !== undefined) {
      coupon.maxRedemptions = parsed.data.maxRedemptions || undefined;
    }
    if (parsed.data.expiresAt !== undefined) {
      coupon.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;
    }
    if (parsed.data.isActive !== undefined) coupon.isActive = parsed.data.isActive;

    await coupon.save();
    return res.json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating coupon" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/coupons/:id
// ---------------------------------------------------------------------------
export async function deleteCoupon(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = getParam(req.params.id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (req.user.role !== "admin" && coupon.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Coupon.findByIdAndDelete(id);
    return res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting coupon" });
  }
}
