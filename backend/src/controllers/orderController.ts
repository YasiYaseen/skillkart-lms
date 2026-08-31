import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Order, { type IOrderItem } from "../models/Order";
import Course from "../models/Course";
import Coupon, { type ICoupon } from "../models/Coupon";
import Enrollment from "../models/Enrollment";
import Notification from "../models/Notification";
import SystemSettings from "../models/SystemSettings";
import { PaymentService } from "../services/paymentService";
import { checkoutSchema } from "../validators/orderValidator";

function getParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

// ---------------------------------------------------------------------------
// POST /api/orders/checkout
// Student completes multi-course cart checkout with coupon discount and payment processing
// ---------------------------------------------------------------------------
export async function checkout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
    if (settings?.maintenanceMode) {
      return res.status(503).json({
        message: settings.maintenanceMessage || "Platform is currently undergoing scheduled maintenance. Please try again shortly.",
      });
    }

    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const { courseIds, couponCode, paymentMethod, billingDetails } = parsed.data;

    // Filter valid IDs
    const validCourseIds = courseIds.filter((id) => isValidObjectId(id));
    if (validCourseIds.length === 0) {
      return res.status(400).json({ message: "No valid courses in checkout cart." });
    }

    const courses = await Course.find({ _id: { $in: validCourseIds } })
      .select("_id title price isPaid instructor")
      .lean();

    if (courses.length === 0) {
      return res.status(404).json({ message: "Courses not found." });
    }

    const commissionRate = settings?.platformCommissionRate ?? 20;
    const payoutShareRate = settings?.instructorPayoutShare ?? 80;

    // Calculate subtotal and build order items with baseline payouts
    let subtotal = 0;
    const items: IOrderItem[] = courses.map((c) => {
      const price = typeof c.price === "number" ? c.price : 0;
      subtotal += price;
      const baseInstructorPayout = Math.round(price * (payoutShareRate / 100) * 100) / 100;
      const basePlatformFee = Math.round((price - baseInstructorPayout) * 100) / 100;
      return {
        course: new Types.ObjectId(c._id.toString()),
        title: c.title,
        originalPrice: price,
        discountAmount: 0,
        discountFundedBy: "none",
        finalPrice: price,
        instructorPayout: baseInstructorPayout,
        platformFee: basePlatformFee,
      };
    });

    let discountTotal = 0;
    let appliedCoupon: ICoupon | null = null;

    // Validate and calculate coupon discount if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const hasRedemptions = !coupon.maxRedemptions || coupon.timesRedeemed < coupon.maxRedemptions;
        const meetsMinPurchase = !coupon.minPurchaseAmount || subtotal >= coupon.minPurchaseAmount;

        if (isNotExpired && hasRedemptions && meetsMinPurchase) {
          const fundedBy = coupon.fundedBy || (coupon.creatorRole === "admin" ? "platform" : "instructor");
          const scope = coupon.scope || (coupon.course ? "single_course" : coupon.creatorRole === "admin" ? "platform_global" : "instructor_all");

          if (scope === "single_course" || coupon.course) {
            // Course-specific coupon
            const targetItem = items.find(
              (it) => it.course.toString() === coupon.course?.toString()
            );
            if (targetItem) {
              appliedCoupon = coupon;
              let itemDiscount =
                coupon.discountType === "percentage"
                  ? (targetItem.originalPrice * coupon.discountValue) / 100
                  : Math.min(targetItem.originalPrice, coupon.discountValue);

              if (coupon.maxDiscountAmount && itemDiscount > coupon.maxDiscountAmount) {
                itemDiscount = coupon.maxDiscountAmount;
              }

              // If platform-funded, cap discount at platform commission to prevent deficit
              if (fundedBy === "platform") {
                const maxAllowedPlatformDiscount = (targetItem.originalPrice * commissionRate) / 100;
                itemDiscount = Math.min(itemDiscount, maxAllowedPlatformDiscount);
              }

              targetItem.discountAmount = Math.round(itemDiscount * 100) / 100;
              targetItem.discountFundedBy = fundedBy;
              targetItem.finalPrice = Math.max(0, targetItem.originalPrice - targetItem.discountAmount);

              if (fundedBy === "platform") {
                // Instructor receives guaranteed 100% of baseline
                targetItem.instructorPayout = Math.round(targetItem.originalPrice * (payoutShareRate / 100) * 100) / 100;
                targetItem.platformFee = Math.max(0, Math.round((targetItem.finalPrice - targetItem.instructorPayout) * 100) / 100);
              } else {
                // Instructor funds discount
                targetItem.instructorPayout = Math.round(targetItem.finalPrice * (payoutShareRate / 100) * 100) / 100;
                targetItem.platformFee = Math.round(targetItem.finalPrice * (commissionRate / 100) * 100) / 100;
              }

              discountTotal = targetItem.discountAmount;
            }
          } else if (scope === "instructor_all" || (coupon.creatorRole === "instructor" && coupon.instructor)) {
            // Instructor catalog coupon: apply ONLY to courses by this instructor
            const instructorIdStr = coupon.instructor ? String(coupon.instructor) : "";
            const instructorCourseIds = new Set(
              courses
                .filter((c) => {
                  const cInst = c.instructor as any;
                  const cInstructorId = String(cInst?._id || cInst || "");
                  return cInstructorId === instructorIdStr;
                })
                .map((c) => c._id.toString())
            );

            const applicableItems = items.filter((it) => instructorCourseIds.has(it.course.toString()));

            if (applicableItems.length > 0) {
              appliedCoupon = coupon;
              let instSubtotal = applicableItems.reduce((acc, it) => acc + it.originalPrice, 0);

              let rawDiscount =
                coupon.discountType === "percentage"
                  ? (instSubtotal * coupon.discountValue) / 100
                  : Math.min(instSubtotal, coupon.discountValue);

              if (coupon.maxDiscountAmount && rawDiscount > coupon.maxDiscountAmount) {
                rawDiscount = coupon.maxDiscountAmount;
              }

              let totalAllocated = 0;
              applicableItems.forEach((it, idx) => {
                let itemDisc = 0;
                if (idx === applicableItems.length - 1) {
                  itemDisc = Math.round((rawDiscount - totalAllocated) * 100) / 100;
                } else {
                  itemDisc = Math.round(((it.originalPrice / instSubtotal) * rawDiscount) * 100) / 100;
                  totalAllocated += itemDisc;
                }

                it.discountAmount = itemDisc;
                it.discountFundedBy = "instructor";
                it.finalPrice = Math.max(0, it.originalPrice - it.discountAmount);
                it.instructorPayout = Math.round(it.finalPrice * (payoutShareRate / 100) * 100) / 100;
                it.platformFee = Math.round(it.finalPrice * (commissionRate / 100) * 100) / 100;
                discountTotal += it.discountAmount;
              });
            }
          } else {
            // Platform global coupon: applies across all items with protected instructor payouts
            appliedCoupon = coupon;
            let rawDiscount =
              coupon.discountType === "percentage"
                ? (subtotal * coupon.discountValue) / 100
                : Math.min(subtotal, coupon.discountValue);

            if (coupon.maxDiscountAmount && rawDiscount > coupon.maxDiscountAmount) {
              rawDiscount = coupon.maxDiscountAmount;
            }

            let totalAllocated = 0;
            items.forEach((it, idx) => {
              let itemDisc = 0;
              if (idx === items.length - 1) {
                itemDisc = Math.round((rawDiscount - totalAllocated) * 100) / 100;
              } else {
                itemDisc = Math.round(((it.originalPrice / subtotal) * rawDiscount) * 100) / 100;
                totalAllocated += itemDisc;
              }

              // Platform subsidy cap per item
              const maxAllowedPlatformDisc = Math.round(it.originalPrice * (commissionRate / 100) * 100) / 100;
              itemDisc = Math.min(itemDisc, maxAllowedPlatformDisc);

              it.discountAmount = itemDisc;
              it.discountFundedBy = "platform";
              it.finalPrice = Math.max(0, it.originalPrice - it.discountAmount);
              // PROTECTED BASELINE PAYOUT
              it.instructorPayout = Math.round(it.originalPrice * (payoutShareRate / 100) * 100) / 100;
              it.platformFee = Math.max(0, Math.round((it.finalPrice - it.instructorPayout) * 100) / 100);
              discountTotal += it.discountAmount;
            });
          }
        }
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);
    const primaryCurrency = settings?.primaryCurrency || "USD";

    // Process payment through pluggable PaymentService
    const paymentResult = await PaymentService.executePayment(
      totalAmount === 0 ? "free" : paymentMethod,
      totalAmount,
      primaryCurrency,
      {
        studentId: req.user.id,
        courseCount: items.length,
        billingDetails,
      }
    );

    if (!paymentResult.success) {
      return res.status(402).json({
        message: paymentResult.message || "Payment authorization failed. Please try again.",
      });
    }

    // Generate unique order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SK-${dateStr}-${randomSuffix}`;

    // Create Order record
    const order = await Order.create({
      orderNumber,
      student: req.user.id,
      items,
      coupon: appliedCoupon?._id,
      couponCode: appliedCoupon?.code,
      subtotal,
      discountTotal,
      taxAmount: 0,
      totalAmount,
      currency: primaryCurrency,
      paymentMethod: totalAmount === 0 ? "free" : paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      transactionId: paymentResult.transactionId,
      paymentMetadata: paymentResult.metadata,
      completedAt: new Date(),
    });

    // Increment coupon redemption count if applied
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { timesRedeemed: 1 } });
    }

    const userId = req.user.id;

    // Auto-enroll student into all purchased courses
    const enrollmentPromises = courses.map((course) =>
      Enrollment.findOneAndUpdate(
        { student: userId, course: course._id },
        {
          student: userId,
          course: course._id,
          status: "active",
          enrolledAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );
    await Promise.all(enrollmentPromises);

    // Trigger confirmation notification
    setImmediate(async () => {
      try {
        await Notification.create({
          recipient: userId,
          title: "Order Confirmed & Enrolled",
          message: `Your order #${orderNumber} for ${items.length} course(s) has been confirmed. You now have full access!`,
          type: "success",
          link: "/my-courses",
        });
      } catch {
        // Safe fail
      }
    });

    return res.status(201).json({
      message: "Order placed successfully! You are now enrolled in your courses.",
      order,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error processing checkout" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/history
// Student fetches their purchase order history
// ---------------------------------------------------------------------------
export async function getOrderHistory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({ student: req.user.id })
      .populate("items.course", "title thumbnail")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching order history" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/:orderId/receipt
// View individual order receipt details
// ---------------------------------------------------------------------------
export async function getOrderReceipt(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orderId = getParam(req.params.orderId);
    let order;

    if (isValidObjectId(orderId)) {
      order = await Order.findById(orderId)
        .populate("student", "name email")
        .populate("items.course", "title instructor")
        .lean();
    } else {
      order = await Order.findOne({ orderNumber: orderId })
        .populate("student", "name email")
        .populate("items.course", "title instructor")
        .lean();
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const studentIdStr =
      order.student && typeof order.student === "object" && "_id" in order.student
        ? String(order.student._id)
        : String(order.student || "");

    const isOwnerOrAdmin = req.user.role === "admin" || studentIdStr === req.user.id;

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching receipt" });
  }
}
