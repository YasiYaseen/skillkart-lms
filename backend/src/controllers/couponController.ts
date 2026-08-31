import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Coupon from "../models/Coupon";
import Course from "../models/Course";
import SystemSettings from "../models/SystemSettings";
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
// GET /api/coupons/featured
// Public endpoint for CartPage to dynamically show active public platform coupons
// ---------------------------------------------------------------------------
export async function getFeaturedCoupons(_req: Request, res: Response) {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      isPublic: true,
      creatorRole: "admin",
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select("code title discountType discountValue minPurchaseAmount maxDiscountAmount description")
      .sort({ discountValue: -1 })
      .limit(6)
      .lean();

    // Filter out redemptions exceeded
    const available = coupons.filter(
      (c) => !c.maxRedemptions || c.timesRedeemed < c.maxRedemptions
    );

    return res.json({
      coupons: available.map((c) => ({
        _id: c._id,
        code: c.code,
        title: c.title || (c.discountType === "percentage" ? `${c.discountValue}% OFF Promo` : `$${c.discountValue} OFF Promo`),
        discountType: c.discountType,
        discountValue: c.discountValue,
        minPurchaseAmount: c.minPurchaseAmount || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching featured coupons" });
  }
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
      return res.status(400).json({ message: "No valid courses provided in cart." });
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

    // Fetch courses in cart with instructor
    const courses = await Course.find({ _id: { $in: validCourseIds } })
      .select("_id title price instructor")
      .populate("instructor", "name")
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

    const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
    const liveCommissionRate = settings?.platformCommissionRate ?? 20;

    let discountTotal = 0;
    let applicableItemsCount = 0;

    const creatorRole = coupon.creatorRole || "instructor";
    const fundedBy = coupon.fundedBy || (creatorRole === "admin" ? "platform" : "instructor");
    const scope = coupon.scope || (coupon.course ? "single_course" : creatorRole === "admin" ? "platform_global" : "instructor_all");

    if (scope === "single_course" || coupon.course) {
      // Course-specific coupon
      const targetCourse = courses.find((c) => c._id.toString() === coupon.course?.toString());
      if (!targetCourse) {
        return res.status(400).json({
          message: "This coupon is only valid for a specific course that is not in your cart.",
        });
      }
      applicableItemsCount = 1;
      const coursePrice = typeof targetCourse.price === "number" ? targetCourse.price : 0;
      if (coupon.discountType === "percentage") {
        discountTotal = (coursePrice * coupon.discountValue) / 100;
      } else {
        discountTotal = Math.min(coursePrice, coupon.discountValue);
      }

      // If platform-funded, cap discount at current live platform commission
      if (fundedBy === "platform") {
        const maxPlatformCap = (coursePrice * liveCommissionRate) / 100;
        discountTotal = Math.min(discountTotal, maxPlatformCap);
      }
    } else if (scope === "instructor_all" || (creatorRole === "instructor" && coupon.instructor)) {
      // Instructor catalog coupon: only applies to courses by this instructor
      const instructorIdStr = coupon.instructor ? String(coupon.instructor) : "";
      const instructorCourses = courses.filter((c) => {
        const cInst = c.instructor as any;
        const cInstructorId = String(cInst?._id || cInst || "");
        return cInstructorId === instructorIdStr;
      });

      if (instructorCourses.length === 0) {
        return res.status(400).json({
          message: "This coupon is only valid for courses created by the publishing instructor.",
        });
      }

      applicableItemsCount = instructorCourses.length;
      let instructorSubtotal = 0;
      instructorCourses.forEach((c) => {
        instructorSubtotal += typeof c.price === "number" ? c.price : 0;
      });

      if (coupon.discountType === "percentage") {
        discountTotal = (instructorSubtotal * coupon.discountValue) / 100;
      } else {
        discountTotal = Math.min(instructorSubtotal, coupon.discountValue);
      }
    } else {
      // Platform-wide global cart discount
      applicableItemsCount = courses.length;
      if (coupon.discountType === "percentage") {
        discountTotal = (subtotal * coupon.discountValue) / 100;
      } else {
        discountTotal = Math.min(subtotal, coupon.discountValue);
      }

      // Live platform commission subsidy cap (prevents negative platform revenue even if commission rate changed)
      const maxPlatformCap = (subtotal * liveCommissionRate) / 100;
      discountTotal = Math.min(discountTotal, maxPlatformCap);
    }

    // Cap at max discount if defined
    if (coupon.maxDiscountAmount && discountTotal > coupon.maxDiscountAmount) {
      discountTotal = coupon.maxDiscountAmount;
    }

    // Never exceed subtotal or be less than 0
    discountTotal = Math.max(0, Math.min(discountTotal, subtotal));
    discountTotal = Math.round(discountTotal * 100) / 100;
    const totalAmount = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

    return res.json({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        title: coupon.title || coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        scope,
        creatorRole: coupon.creatorRole || "instructor",
        fundedBy: coupon.fundedBy || (coupon.creatorRole === "admin" ? "platform" : "instructor"),
        description:
          coupon.discountType === "percentage"
            ? `${coupon.discountValue}% OFF`
            : `$${coupon.discountValue} OFF`,
      },
      subtotal,
      discountTotal,
      totalAmount,
      applicableItemsCount,
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
      filter.creatorRole = "instructor";
    }

    const coupons = await Coupon.find(filter)
      .populate("course", "title")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ coupons });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching coupons" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/coupons/admin
// Admin fetches all platform and instructor coupons with metrics
// ---------------------------------------------------------------------------
export async function getAdminCoupons(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
    const platformCommissionRate = settings?.platformCommissionRate ?? 20;

    const coupons = await Coupon.find()
      .populate("course", "title")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      coupons,
      platformCommissionRate,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching admin coupons" });
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

    const isAdmin = req.user.role === "admin";
    const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
    const platformCommissionRate = settings?.platformCommissionRate ?? 20;

    let courseRef: Types.ObjectId | undefined;
    if (parsed.data.courseId && isValidObjectId(parsed.data.courseId)) {
      courseRef = new Types.ObjectId(parsed.data.courseId);
    }

    let creatorRole: "admin" | "instructor" = "instructor";
    let fundedBy: "platform" | "instructor" = "instructor";
    let scope: "single_course" | "instructor_all" | "platform_global" = courseRef ? "single_course" : "instructor_all";
    let isPublic = false;

    if (isAdmin) {
      creatorRole = "admin";
      fundedBy = "platform";
      scope = parsed.data.scope || (courseRef ? "single_course" : "platform_global");
      isPublic = !!parsed.data.isPublic;

      // Commission capping safeguard for platform coupons
      if (parsed.data.discountType === "percentage" && parsed.data.discountValue > platformCommissionRate) {
        return res.status(400).json({
          message: `Platform coupon discount (${parsed.data.discountValue}%) cannot exceed the platform commission rate (${platformCommissionRate}%) to protect instructor revenue and prevent platform deficits.`,
        });
      }
    } else {
      creatorRole = "instructor";
      fundedBy = "instructor";
      scope = courseRef ? "single_course" : "instructor_all";
      isPublic = false; // Instructor coupons are always unlisted from global cart
    }

    const coupon = await Coupon.create({
      code: parsed.data.code.toUpperCase(),
      title: parsed.data.title || undefined,
      creatorRole,
      scope,
      fundedBy,
      isPublic,
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

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && coupon.instructor?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = updateCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    // Commission capping check if admin updates percentage discount
    if (isAdmin && coupon.creatorRole === "admin") {
      const discountType = parsed.data.discountType || coupon.discountType;
      const discountVal = parsed.data.discountValue !== undefined ? parsed.data.discountValue : coupon.discountValue;
      if (discountType === "percentage") {
        const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
        const platformCommissionRate = settings?.platformCommissionRate ?? 20;
        if (discountVal > platformCommissionRate) {
          return res.status(400).json({
            message: `Platform coupon discount (${discountVal}%) cannot exceed the platform commission rate (${platformCommissionRate}%).`,
          });
        }
      }
    }

    if (parsed.data.code) coupon.code = parsed.data.code.toUpperCase();
    if (parsed.data.title !== undefined) coupon.title = parsed.data.title || undefined;
    if (parsed.data.discountType) coupon.discountType = parsed.data.discountType;
    if (parsed.data.discountValue !== undefined) coupon.discountValue = parsed.data.discountValue;
    if (parsed.data.scope) coupon.scope = parsed.data.scope;
    if (isAdmin && parsed.data.isPublic !== undefined) coupon.isPublic = parsed.data.isPublic;
    if (parsed.data.courseId !== undefined) {
      coupon.course = parsed.data.courseId && isValidObjectId(parsed.data.courseId)
        ? new Types.ObjectId(parsed.data.courseId)
        : undefined;
      coupon.scope = coupon.course ? "single_course" : (coupon.creatorRole === "admin" ? "platform_global" : "instructor_all");
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

    if (req.user.role !== "admin" && coupon.instructor?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Coupon.findByIdAndDelete(id);
    return res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting coupon" });
  }
}

