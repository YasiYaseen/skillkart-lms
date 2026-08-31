import type { Request, Response } from "express";
import { Types } from "mongoose";
import Course from "../../models/Course";
import Order from "../../models/Order";
import Payout from "../../models/Payout";
import SystemSettings from "../../models/SystemSettings";

export async function getInstructorEarnings(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const instructorId = new Types.ObjectId(req.user.id);
    const { range = "30d" } = req.query as { range?: string };

    // 1. Fetch all courses belonging to this instructor
    const courses = await Course.find({ instructor: instructorId })
      .select("_id title price status thumbnailUrl createdAt")
      .lean();

    const courseIds = courses.map((c) => c._id);
    const courseIdSet = new Set(courseIds.map((id) => id.toString()));

    // 2. Fetch all completed orders containing this instructor's courses
    const allCompletedOrders = await Order.find({
      paymentStatus: "completed",
      "items.course": { $in: courseIds },
    })
      .populate("student", "name email")
      .populate("coupon", "code discountType discountValue")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Compute Lifetime Metrics
    let lifetimeGross = 0;
    let lifetimeNet = 0;
    let lifetimePlatformFees = 0;

    for (const order of allCompletedOrders) {
      for (const item of order.items) {
        if (item.course && courseIdSet.has(item.course.toString())) {
          const itemFinal = Number(item.finalPrice) || 0;
          const takeHome = typeof item.instructorPayout === "number"
            ? item.instructorPayout
            : Math.round(itemFinal * 0.80 * 100) / 100;
          const fee = typeof item.platformFee === "number"
            ? item.platformFee
            : Math.round((itemFinal - takeHome) * 100) / 100;

          lifetimeGross += itemFinal;
          lifetimeNet += takeHome;
          lifetimePlatformFees += fee;
        }
      }
    }

    // 4. Calculate Date Range Bounds & Previous Period for MoM comparison
    const now = new Date();
    let currentStart: Date | null = null;
    let prevStart: Date | null = null;
    let prevEnd: Date | null = null;

    if (range === "today") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = currentStart;
    } else if (range === "7d") {
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEnd = currentStart;
    } else if (range === "30d") {
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevEnd = currentStart;
    } else if (range === "month") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (range === "year") {
      currentStart = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    }

    // Filter orders for selected period
    const filteredOrders = currentStart
      ? allCompletedOrders.filter((o) => new Date(o.createdAt) >= currentStart!)
      : allCompletedOrders;

    // Previous period orders for comparison
    const previousOrders = prevStart && prevEnd
      ? allCompletedOrders.filter((o) => {
          const d = new Date(o.createdAt);
          return d >= prevStart! && d <= prevEnd!;
        })
      : [];

    // Aggregate Course & Sales data for the selected period
    const courseMap: Record<
      string,
      {
        courseId: string;
        title: string;
        price: number;
        thumbnailUrl?: string;
        unitsSold: number;
        grossRevenue: number;
        discountAbsorbed: number;
        platformFee: number;
        netEarnings: number;
      }
    > = {};

    courses.forEach((c) => {
      courseMap[c._id.toString()] = {
        courseId: c._id.toString(),
        title: c.title,
        price: c.price || 0,
        thumbnailUrl: c.thumbnailUrl,
        unitsSold: 0,
        grossRevenue: 0,
        discountAbsorbed: 0,
        platformFee: 0,
        netEarnings: 0,
      };
    });

    let periodGross = 0;
    let periodNet = 0;
    let periodPlatformFees = 0;
    let periodDiscountAbsorbed = 0;

    const monthlyMap: Record<string, { month: string; gross: number; net: number; sales: number }> = {};
    const salesLedger: Array<{
      orderNumber: string;
      date: string;
      studentName: string;
      studentEmail: string;
      courseTitle: string;
      salePrice: number;
      platformFee: number;
      instructorTakeHome: number;
      couponUsed?: string;
    }> = [];

    // Promo vs Organic tracking
    let couponSalesCount = 0;
    let couponGross = 0;
    let couponNet = 0;
    let organicSalesCount = 0;
    let organicGross = 0;
    let organicNet = 0;

    const couponMap: Record<string, { code: string; unitsSold: number; grossRevenue: number; discountGiven: number; instructorNet: number }> = {};

    for (const order of filteredOrders) {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, gross: 0, net: 0, sales: 0 };
      }

      const orderCouponCode = order.couponCode || (order.coupon && typeof order.coupon === "object" ? (order.coupon as any).code : null);

      for (const item of order.items) {
        const itemCourseId = item.course ? item.course.toString() : "";
        if (courseMap[itemCourseId]) {
          const itemFinalPrice = Number(item.finalPrice) || 0;
          const itemDiscount = Number(item.discountAmount) || 0;
          const takeHome = typeof item.instructorPayout === "number"
            ? item.instructorPayout
            : Math.round(itemFinalPrice * 0.80 * 100) / 100;
          const fee = typeof item.platformFee === "number"
            ? item.platformFee
            : Math.round((itemFinalPrice - takeHome) * 100) / 100;

          courseMap[itemCourseId].unitsSold += 1;
          courseMap[itemCourseId].grossRevenue += itemFinalPrice;
          courseMap[itemCourseId].discountAbsorbed += itemDiscount;
          courseMap[itemCourseId].platformFee += fee;
          courseMap[itemCourseId].netEarnings += takeHome;

          periodGross += itemFinalPrice;
          periodNet += takeHome;
          periodPlatformFees += fee;
          periodDiscountAbsorbed += itemDiscount;

          monthlyMap[monthKey].gross += itemFinalPrice;
          monthlyMap[monthKey].net += takeHome;
          monthlyMap[monthKey].sales += 1;

          if (orderCouponCode) {
            couponSalesCount += 1;
            couponGross += itemFinalPrice;
            couponNet += takeHome;

            if (!couponMap[orderCouponCode]) {
              couponMap[orderCouponCode] = { code: orderCouponCode, unitsSold: 0, grossRevenue: 0, discountGiven: 0, instructorNet: 0 };
            }
            couponMap[orderCouponCode].unitsSold += 1;
            couponMap[orderCouponCode].grossRevenue += itemFinalPrice;
            couponMap[orderCouponCode].discountGiven += itemDiscount;
            couponMap[orderCouponCode].instructorNet += takeHome;
          } else {
            organicSalesCount += 1;
            organicGross += itemFinalPrice;
            organicNet += takeHome;
          }

          const student = (order.student && typeof order.student === "object" ? order.student : null) as { name?: string; email?: string } | null;
          const billing = order.paymentMetadata && typeof order.paymentMetadata === "object" && "billingDetails" in order.paymentMetadata
            ? (order.paymentMetadata.billingDetails as { name?: string; email?: string } | undefined)
            : undefined;

          salesLedger.push({
            orderNumber: order.orderNumber,
            date: orderDate.toISOString(),
            studentName: student?.name || billing?.name || "Student",
            studentEmail: student?.email || billing?.email || "",
            courseTitle: item.title || courseMap[itemCourseId].title,
            salePrice: itemFinalPrice,
            platformFee: fee,
            instructorTakeHome: takeHome,
            couponUsed: orderCouponCode || undefined,
          });
        }
      }
    }

    // Previous period aggregates for MoM delta calculation
    let prevPeriodGross = 0;
    let prevPeriodNet = 0;
    let prevSalesCount = 0;

    for (const order of previousOrders) {
      for (const item of order.items) {
        if (item.course && courseIdSet.has(item.course.toString())) {
          const itemFinal = Number(item.finalPrice) || 0;
          const takeHome = typeof item.instructorPayout === "number"
            ? item.instructorPayout
            : Math.round(itemFinal * 0.80 * 100) / 100;
          prevPeriodGross += itemFinal;
          prevPeriodNet += takeHome;
          prevSalesCount += 1;
        }
      }
    }

    const calcPercentDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const momGrowth = {
      grossPercent: calcPercentDelta(periodGross, prevPeriodGross),
      netPercent: calcPercentDelta(periodNet, prevPeriodNet),
      salesCountPercent: calcPercentDelta(salesLedger.length, prevSalesCount),
    };

    // 5. Fetch instructor payout history & compute balance
    const payouts = await Payout.find({ instructor: instructorId }).sort({ createdAt: -1 }).lean();

    let totalPayoutsWithdrawn = 0;
    let pendingPayoutsAmount = 0;

    payouts.forEach((p) => {
      if (p.status === "completed") {
        totalPayoutsWithdrawn += p.amount;
      } else if (p.status === "pending" || p.status === "processing") {
        pendingPayoutsAmount += p.amount;
      }
    });

    const totalReservedOrWithdrawn = totalPayoutsWithdrawn + pendingPayoutsAmount;
    const availableBalance = Math.max(0, Math.round((lifetimeNet - totalReservedOrWithdrawn) * 100) / 100);

    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    const courseBreakdown = Object.values(courseMap)
      .map((c) => ({
        ...c,
        grossRevenue: Math.round(c.grossRevenue * 100) / 100,
        discountAbsorbed: Math.round(c.discountAbsorbed * 100) / 100,
        platformFee: Math.round(c.platformFee * 100) / 100,
        netEarnings: Math.round(c.netEarnings * 100) / 100,
      }))
      .sort((a, b) => b.netEarnings - a.netEarnings);

    const promoPerformance = {
      promoVsOrganic: {
        couponSalesCount,
        couponGross: Math.round(couponGross * 100) / 100,
        couponNet: Math.round(couponNet * 100) / 100,
        organicSalesCount,
        organicGross: Math.round(organicGross * 100) / 100,
        organicNet: Math.round(organicNet * 100) / 100,
      },
      coupons: Object.values(couponMap).sort((a, b) => b.unitsSold - a.unitsSold),
    };

    return res.json({
      range,
      summary: {
        totalGrossSales: Math.round(periodGross * 100) / 100,
        totalPlatformFees: Math.round(periodPlatformFees * 100) / 100,
        totalLifetimeNetEarnings: Math.round(lifetimeNet * 100) / 100,
        periodNetEarnings: Math.round(periodNet * 100) / 100,
        totalPayoutsWithdrawn: Math.round(totalPayoutsWithdrawn * 100) / 100,
        pendingPayoutsAmount: Math.round(pendingPayoutsAmount * 100) / 100,
        availableBalance,
        totalCoursesCount: courses.length,
        totalUnitsSold: salesLedger.length,
      },
      momGrowth,
      promoPerformance,
      courseBreakdown,
      monthlyTrend,
      payouts,
      recentSales: salesLedger.slice(0, 20),
    });
  } catch (error) {
    console.error("Error in getInstructorEarnings:", error);
    return res.status(500).json({ message: "Failed to load instructor earnings" });
  }
}

export async function requestInstructorPayout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const instructorId = new Types.ObjectId(req.user.id);
    const { amount, method, accountDetails, notes } = req.body;

    const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
    const primaryCurrency = settings?.primaryCurrency || "USD";
    const minThreshold = settings?.minPayoutThreshold ?? 50;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < minThreshold) {
      return res.status(400).json({ message: `Minimum payout withdrawal amount is ${minThreshold.toFixed(2)} ${primaryCurrency}` });
    }

    if (!["bank_transfer", "paypal", "stripe"].includes(method)) {
      return res.status(400).json({ message: "Invalid payout withdrawal method" });
    }

    // Verify instructor available balance
    const courses = await Course.find({ instructor: instructorId }).select("_id").lean();
    const courseIds = courses.map((c) => c._id);

    const orders = await Order.find({
      paymentStatus: "completed",
      "items.course": { $in: courseIds },
    }).lean();

    let totalLifetimeNetEarnings = 0;
    const courseIdSet = new Set(courseIds.map((id) => id.toString()));

    for (const order of orders) {
      for (const item of order.items) {
        if (item.course && courseIdSet.has(item.course.toString())) {
          const itemFinalPrice = Number(item.finalPrice) || 0;
          const takeHome = typeof item.instructorPayout === "number"
            ? item.instructorPayout
            : Math.round(itemFinalPrice * 0.80 * 100) / 100;
          totalLifetimeNetEarnings += takeHome;
        }
      }
    }

    totalLifetimeNetEarnings = Math.round(totalLifetimeNetEarnings * 100) / 100;

    const existingPayouts = await Payout.find({
      instructor: instructorId,
      status: { $in: ["pending", "processing", "completed"] },
    }).lean();

    const alreadyClaimed = existingPayouts.reduce((acc, p) => acc + p.amount, 0);
    const availableBalance = Math.max(0, Math.round((totalLifetimeNetEarnings - alreadyClaimed) * 100) / 100);

    if (withdrawAmount > availableBalance) {
      return res.status(400).json({
        message: `Requested amount (${withdrawAmount.toFixed(2)} ${primaryCurrency}) exceeds available balance (${availableBalance.toFixed(2)} ${primaryCurrency})`,
      });
    }

    const referenceNumber = `PAYOUT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayout = await Payout.create({
      instructor: instructorId,
      amount: withdrawAmount,
      currency: primaryCurrency,
      method,
      accountDetails: accountDetails || {},
      status: "pending",
      referenceNumber,
      notes,
    });

    return res.status(201).json({
      message: "Payout withdrawal request submitted successfully",
      payout: newPayout,
      newAvailableBalance: Math.round((availableBalance - withdrawAmount) * 100) / 100,
    });
  } catch (error) {
    console.error("Error in requestInstructorPayout:", error);
    return res.status(500).json({ message: "Failed to submit payout request" });
  }
}

export async function exportEarningsCsv(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const instructorId = new Types.ObjectId(req.user.id);
    const courses = await Course.find({ instructor: instructorId }).select("_id title").lean();
    const courseIds = courses.map((c) => c._id);
    const courseIdSet = new Set(courseIds.map((id) => id.toString()));

    const orders = await Order.find({
      paymentStatus: "completed",
      "items.course": { $in: courseIds },
    })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Order Number",
      "Date",
      "Student Name",
      "Student Email",
      "Course Title",
      "Sale Price ($)",
      "Platform Fee ($)",
      "Instructor Net ($)",
      "Payment Status",
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [headers.join(",")];

    for (const order of orders) {
      for (const item of order.items) {
        if (item.course && courseIdSet.has(item.course.toString())) {
          const itemFinalPrice = Number(item.finalPrice) || 0;
          const takeHome = typeof item.instructorPayout === "number"
            ? item.instructorPayout
            : Math.round(itemFinalPrice * 0.80 * 100) / 100;
          const fee = typeof item.platformFee === "number"
            ? item.platformFee
            : Math.round((itemFinalPrice - takeHome) * 100) / 100;

          const student = (order.student && typeof order.student === "object" ? order.student : null) as { name?: string; email?: string } | null;
          const billing = order.paymentMetadata && typeof order.paymentMetadata === "object" && "billingDetails" in order.paymentMetadata
            ? (order.paymentMetadata.billingDetails as { name?: string; email?: string } | undefined)
            : undefined;

          const row = [
            escapeCsv(order.orderNumber),
            escapeCsv(new Date(order.createdAt).toISOString()),
            escapeCsv(student?.name || billing?.name || "Student"),
            escapeCsv(student?.email || billing?.email || ""),
            escapeCsv(item.title),
            escapeCsv(itemFinalPrice.toFixed(2)),
            escapeCsv(fee.toFixed(2)),
            escapeCsv(takeHome.toFixed(2)),
            escapeCsv(order.paymentStatus),
          ];
          csvRows.push(row.join(","));
        }
      }
    }

    const csvContent = csvRows.join("\n");
    const filename = `skillkart-instructor-earnings-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting instructor earnings CSV:", error);
    return res.status(500).json({ message: "Failed to export earnings statement" });
  }
}
