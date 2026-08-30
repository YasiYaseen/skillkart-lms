import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Order, { type IOrderItem } from "../models/Order";
import Course from "../models/Course";
import Coupon, { type ICoupon } from "../models/Coupon";
import Enrollment from "../models/Enrollment";
import Notification from "../models/Notification";
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

    // Calculate subtotal and build order items
    let subtotal = 0;
    const items: IOrderItem[] = courses.map((c) => {
      const price = typeof c.price === "number" ? c.price : 0;
      subtotal += price;
      return {
        course: new Types.ObjectId(c._id.toString()),
        title: c.title,
        originalPrice: price,
        discountAmount: 0,
        finalPrice: price,
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
          appliedCoupon = coupon;
          if (coupon.course) {
            // Find item corresponding to the specific course
            const targetItem = items.find(
              (it) => it.course.toString() === coupon.course?.toString()
            );
            if (targetItem) {
              const itemDiscount =
                coupon.discountType === "percentage"
                  ? (targetItem.originalPrice * coupon.discountValue) / 100
                  : Math.min(targetItem.originalPrice, coupon.discountValue);

              const finalItemDiscount = coupon.maxDiscountAmount
                ? Math.min(itemDiscount, coupon.maxDiscountAmount)
                : itemDiscount;

              targetItem.discountAmount = Math.round(finalItemDiscount * 100) / 100;
              targetItem.finalPrice = Math.max(0, targetItem.originalPrice - targetItem.discountAmount);
              discountTotal = targetItem.discountAmount;
            }
          } else {
            // Global cart discount distributed across items
            const rawDiscount =
              coupon.discountType === "percentage"
                ? (subtotal * coupon.discountValue) / 100
                : Math.min(subtotal, coupon.discountValue);

            const cappedDiscount = coupon.maxDiscountAmount
              ? Math.min(rawDiscount, coupon.maxDiscountAmount)
              : rawDiscount;

            discountTotal = Math.round(cappedDiscount * 100) / 100;

            // Distribute discount proportionally across items
            if (subtotal > 0) {
              let allocatedDiscount = 0;
              items.forEach((it, idx) => {
                if (idx === items.length - 1) {
                  it.discountAmount = Math.round((discountTotal - allocatedDiscount) * 100) / 100;
                } else {
                  it.discountAmount = Math.round(((it.originalPrice / subtotal) * discountTotal) * 100) / 100;
                  allocatedDiscount += it.discountAmount;
                }
                it.finalPrice = Math.max(0, it.originalPrice - it.discountAmount);
              });
            }
          }
        }
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

    // Process payment through pluggable PaymentService
    const paymentResult = await PaymentService.executePayment(
      totalAmount === 0 ? "free" : paymentMethod,
      totalAmount,
      "USD",
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
      currency: "USD",
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

    const isOwnerOrAdmin =
      req.user.role === "admin" || (order.student as any)?._id?.toString() === req.user.id;

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching receipt" });
  }
}
