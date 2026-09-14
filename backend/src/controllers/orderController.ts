import type { Request, Response } from "express";
import crypto from "crypto";
import { isValidObjectId, Types } from "mongoose";
import Order, { type IOrder, type IOrderItem } from "../models/Order";
import Course from "../models/Course";
import Coupon, { type ICoupon } from "../models/Coupon";
import Enrollment from "../models/Enrollment";
import Cart from "../models/Cart";
import Wishlist from "../models/Wishlist";
import Notification from "../models/Notification";
import SystemSettings from "../models/SystemSettings";
import { PaymentService } from "../services/paymentService";
import { checkoutSchema } from "../validators/orderValidator";
import {
  isCourseApprovalRequired,
  isCoursePubliclyAccessible,
  getCourseLessonCount,
} from "./course/shared";

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
        maintenanceEstimatedEndTime: settings.maintenanceEstimatedEndTime,
      });
    }

    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const { courseIds, couponCode, paymentMethod, billingDetails, metadata } = parsed.data;

    // Filter valid IDs and deduplicate
    const validCourseIds = Array.from(
      new Set(courseIds.filter((id) => isValidObjectId(id)))
    );
    if (validCourseIds.length === 0) {
      return res.status(400).json({ message: "No valid courses in checkout cart." });
    }

    const requireApproval = await isCourseApprovalRequired();
    const fetchedCourses = await Course.find({ _id: { $in: validCourseIds } })
      .select("_id title price isPaid instructor status isActive isApproved")
      .lean();

    const courseMap = new Map<string, (typeof fetchedCourses)[0]>();
    for (const c of fetchedCourses) {
      courseMap.set(c._id.toString(), c);
    }

    const unpurchasableIds: Types.ObjectId[] = [];
    const unpurchasableTitles: string[] = [];
    const purchasableCourses: typeof fetchedCourses = [];

    for (const id of validCourseIds) {
      const course = courseMap.get(id);
      if (!course) {
        unpurchasableIds.push(new Types.ObjectId(id));
        unpurchasableTitles.push("Unavailable Course");
      } else if (!isCoursePubliclyAccessible(course, requireApproval)) {
        unpurchasableIds.push(course._id as Types.ObjectId);
        unpurchasableTitles.push(course.title || "Unavailable Course");
      } else {
        purchasableCourses.push(course);
      }
    }

    // If any course is unpurchasable (unpublished, draft, disabled, unapproved, or missing),
    // reject checkout with 400 Bad Request and automatically prune them from the user's cart in database.
    if (unpurchasableIds.length > 0) {
      await Cart.findOneAndUpdate(
        { student: req.user.id },
        { $pull: { items: { course: { $in: unpurchasableIds } } } }
      ).catch(() => {});

      const unpurchasableList = unpurchasableTitles.join(", ");
      return res.status(400).json({
        message: `The following course(s) are no longer available for purchase and have been removed from your cart: ${unpurchasableList}. Please review your cart before completing checkout.`,
        unpurchasableCourses: unpurchasableTitles,
      });
    }

    if (purchasableCourses.length === 0) {
      return res.status(400).json({ message: "No purchasable courses in checkout cart." });
    }

    const courses = purchasableCourses;

    // AUDIT-21: Reject checkout if any course is authored by the purchasing user
    const ownedCourses = courses.filter((c) => c.instructor && c.instructor.toString() === req.user!.id);
    if (ownedCourses.length > 0) {
      await Cart.findOneAndUpdate(
        { student: req.user.id },
        { $pull: { items: { course: { $in: ownedCourses.map((c) => c._id) } } } }
      ).catch(() => {});

      const ownedTitles = ownedCourses.map((c) => c.title || "Untitled").join(", ");
      return res.status(400).json({
        message: `Instructors cannot purchase their own courses: ${ownedTitles}. They have been removed from your cart.`,
        ownedCourses: ownedTitles.split(", "),
      });
    }

    // AUDIT-26: Reject checkout if student is already enrolled in any cart courses
    const alreadyEnrolledCourses = await Enrollment.find({
      student: req.user!.id,
      course: { $in: courses.map((c) => c._id) },
      status: { $in: ["active", "completed"] },
    }).select("course");
    if (alreadyEnrolledCourses.length > 0) {
      const enrolledCourseObjectIds = alreadyEnrolledCourses.map((e) => e.course);
      await Cart.findOneAndUpdate(
        { student: req.user.id },
        { $pull: { items: { course: { $in: enrolledCourseObjectIds } } } }
      ).catch(() => {});

      const enrolledIds = new Set(alreadyEnrolledCourses.map((e) => e.course.toString()));
      const enrolledTitles = courses
        .filter((c) => enrolledIds.has(c._id.toString()))
        .map((c) => c.title || "Untitled")
        .join(", ");
      return res.status(400).json({
        message: `You are already enrolled in one or more courses in your cart: ${enrolledTitles}. They have been removed from your cart.`,
        alreadyEnrolledCourses: enrolledTitles.split(", "),
      });
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
              // Defense-in-depth: Ensure instructor-created coupon applies only to instructor's own course
              if (coupon.creatorRole === "instructor" && coupon.instructor) {
                const targetCourseDoc = courses.find((c) => c._id.toString() === targetItem.course.toString());
                const courseInstId = (targetCourseDoc?.instructor as any)?._id?.toString() || targetCourseDoc?.instructor?.toString() || "";
                if (courseInstId && courseInstId !== coupon.instructor.toString()) {
                  return res.status(400).json({
                    message: "This coupon is only valid for courses created by the issuing instructor.",
                  });
                }
              }

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
        ...metadata,
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

    const isConfirmedPayment =
      paymentResult.paymentStatus === "completed" ||
      (paymentResult.paymentStatus as string) === "paid";

    // Create Order record (pending by default if payment has not cleared yet)
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
      paymentStatus: isConfirmedPayment ? "completed" : "pending",
      transactionId: paymentResult.transactionId,
      paymentMetadata: paymentResult.metadata,
      completedAt: isConfirmedPayment ? new Date() : undefined,
    });

    const userId = req.user.id;

    if (isConfirmedPayment) {
      // AUDIT-103: Confirmed payment — activate enrollments and notify student
      await activateOrderEnrollments(order);
    } else {
      // AUDIT-103: Asynchronous pending payment — defer enrollment until gateway confirmation webhook
      setImmediate(async () => {
        try {
          await Notification.create({
            recipient: userId,
            title: "Order Placed — Payment Pending",
            message: `Your order #${orderNumber} for ${items.length} course(s) is pending clearance. Course access will unlock automatically once confirmed.`,
            type: "info",
            link: "/purchase-history",
          });
        } catch {
          // Safe fail
        }
      });
    }

    // Clear user's shopping cart in database once order is placed
    await Cart.findOneAndUpdate(
      { student: userId },
      { $set: { items: [] } }
    ).catch(() => {});

    return res.status(201).json({
      message: isConfirmedPayment
        ? "Order placed successfully! You are now enrolled in your courses."
        : "Order placed. Payment confirmation is pending with your payment provider. Course access will be unlocked once payment clears.",
      order,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error processing checkout" });
  }
}

// ---------------------------------------------------------------------------
// Helper: activateOrderEnrollments
// Activates enrollments and completes an order (used by checkout and webhook)
// ---------------------------------------------------------------------------
export async function activateOrderEnrollments(order: IOrder): Promise<void> {
  const isAlreadyCompleted =
    order.paymentStatus === "completed" ||
    (order.paymentStatus as string) === "paid";

  if (!isAlreadyCompleted) {
    order.paymentStatus = "completed";
    order.completedAt = new Date();
    await order.save();
  }

  // Increment coupon redemption count if applied
  if (order.coupon && !isAlreadyCompleted) {
    await Coupon.findByIdAndUpdate(order.coupon, { $inc: { timesRedeemed: 1 } }).catch(() => {});
  }

  const courseIds = order.items.map((item) => item.course);

  // Auto-enroll student into all purchased courses with accurate totalLessonsCount
  const enrollmentPromises = order.items.map(async (item) => {
    const courseId = item.course.toString();
    const totalLessonsCount = await getCourseLessonCount(courseId);
    return Enrollment.findOneAndUpdate(
      { student: order.student, course: item.course },
      {
        $set: {
          student: order.student,
          course: item.course,
          status: "active",
          paymentStatus: order.totalAmount === 0 ? "none" : "paid",
          paymentId: order.transactionId,
          totalLessonsCount,
        },
        $setOnInsert: {
          enrolledAt: new Date(),
          completedLessonIds: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });
  await Promise.all(enrollmentPromises);

  // Clear purchased courses from user's wishlist in database
  await Wishlist.deleteMany({
    student: order.student,
    course: { $in: courseIds },
  }).catch(() => {});

  // Trigger confirmation notification
  try {
    await Notification.create({
      recipient: order.student,
      title: "Order Confirmed & Enrolled",
      message: `Your payment for order #${order.orderNumber} for ${order.items.length} course(s) has cleared. You now have full access!`,
      type: "success",
      link: "/my-courses",
    });
  } catch {
    // Safe fail
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders/webhook
// Payment gateway webhook confirmation handler for asynchronous payments
// ---------------------------------------------------------------------------
export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    // Razorpay Webhook Signature Verification
    const rzpSignature = req.headers["x-razorpay-signature"] as string | undefined;
    if (rzpSignature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (generatedSignature !== rzpSignature) {
        return res.status(400).json({ message: "Invalid Razorpay webhook signature" });
      }
    }

    const {
      event,
      transactionId,
      orderNumber,
      orderId,
      status,
      paymentStatus,
    } = req.body || {};

    const rzpOrderId = req.body?.payload?.payment?.entity?.order_id || req.body?.payload?.order?.entity?.id;
    const rzpPaymentId = req.body?.payload?.payment?.entity?.id;

    const resolvedTxnId = transactionId || rzpPaymentId || req.body?.data?.object?.id || req.body?.id;
    const resolvedOrderNumber = orderNumber || req.body?.data?.object?.metadata?.orderNumber;
    const resolvedOrderId = orderId || req.body?.data?.object?.metadata?.orderId;
    const resolvedStatus = (status || paymentStatus || event || "").toLowerCase();

    // Find the matching order
    let order: IOrder | null = null;
    if (resolvedOrderId && isValidObjectId(resolvedOrderId)) {
      order = await Order.findById(resolvedOrderId);
    }
    if (!order && resolvedOrderNumber) {
      order = await Order.findOne({ orderNumber: resolvedOrderNumber });
    }
    if (!order && rzpOrderId) {
      order = await Order.findOne({
        $or: [
          { transactionId: rzpOrderId },
          { "paymentMetadata.razorpayOrderId": rzpOrderId },
        ],
      });
    }
    if (!order && resolvedTxnId) {
      order = await Order.findOne({ transactionId: resolvedTxnId });
    }

    if (!order) {
      return res.status(404).json({
        message: "Order not found for webhook event",
        received: req.body,
      });
    }

    const isSuccessEvent =
      resolvedStatus.includes("success") ||
      resolvedStatus.includes("completed") ||
      resolvedStatus.includes("paid") ||
      resolvedStatus.includes("captured") ||
      event === "payment.captured" ||
      event === "order.paid" ||
      event === "payment_intent.succeeded" ||
      event === "checkout.session.completed";

    const isFailureEvent =
      resolvedStatus.includes("failed") ||
      resolvedStatus.includes("decline") ||
      resolvedStatus.includes("cancel") ||
      resolvedStatus.includes("expired") ||
      event === "payment.failed" ||
      event === "payment_intent.payment_failed";

    if (isSuccessEvent) {
      if (resolvedTxnId && order.transactionId !== resolvedTxnId) {
        order.transactionId = resolvedTxnId;
      }
      await activateOrderEnrollments(order);

      return res.status(200).json({
        success: true,
        message: "Order payment confirmed and student enrolled",
        orderNumber: order.orderNumber,
        status: "completed",
      });
    }

    if (isFailureEvent) {
      // If order was already completed, do not cancel without formal refund
      if (order.paymentStatus !== "completed" && (order.paymentStatus as string) !== "paid") {
        order.paymentStatus = "failed";
        await order.save();

        // Ensure no active or pending enrollment remains for this failed order
        await Enrollment.updateMany(
          {
            student: order.student,
            course: { $in: order.items.map((i) => i.course) },
            paymentId: order.transactionId,
          },
          { $set: { status: "cancelled" } }
        );

        setImmediate(async () => {
          try {
            await Notification.create({
              recipient: order.student,
              title: "Payment Authorization Failed",
              message: `Payment for order #${order.orderNumber} could not be completed. Any pending access has been cancelled.`,
              type: "error",
              link: "/purchase-history",
            });
          } catch {
            // Safe fail
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: "Order marked as failed and tentative access revoked",
        orderNumber: order.orderNumber,
        status: "failed",
      });
    }

    return res.status(200).json({
      received: true,
      message: "Webhook event acknowledged without status change",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error processing payment webhook" });
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
      .populate("items.course", "title thumbnailUrl")
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
        .populate("items.course", "title instructor thumbnailUrl")
        .lean();
    } else {
      order = await Order.findOne({ orderNumber: orderId })
        .populate("student", "name email")
        .populate("items.course", "title instructor thumbnailUrl")
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
