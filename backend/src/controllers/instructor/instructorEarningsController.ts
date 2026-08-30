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

    // 1. Fetch all courses belonging to this instructor
    const courses = await Course.find({ instructor: instructorId })
      .select("_id title price status thumbnailUrl createdAt")
      .lean();

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

    const courseIds = courses.map((c) => c._id);

    // 2. Fetch all completed orders containing any of this instructor's courses
    const orders = await Order.find({
      paymentStatus: "completed",
      "items.course": { $in: courseIds },
    })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .lean();

    let totalGrossSales = 0;
    let totalDiscountAbsorbed = 0;
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
    }> = [];

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, gross: 0, net: 0, sales: 0 };
      }

      for (const item of order.items) {
        const itemCourseId = item.course ? item.course.toString() : "";
        if (courseMap[itemCourseId]) {
          const itemFinalPrice = Number(item.finalPrice) || 0;
          const itemDiscount = Number(item.discountAmount) || 0;
          const fee = Math.round(itemFinalPrice * 0.20 * 100) / 100;
          const takeHome = Math.round(itemFinalPrice * 0.80 * 100) / 100;

          courseMap[itemCourseId].unitsSold += 1;
          courseMap[itemCourseId].grossRevenue += itemFinalPrice;
          courseMap[itemCourseId].discountAbsorbed += itemDiscount;
          courseMap[itemCourseId].platformFee += fee;
          courseMap[itemCourseId].netEarnings += takeHome;

          totalGrossSales += itemFinalPrice;
          totalDiscountAbsorbed += itemDiscount;

          monthlyMap[monthKey].gross += itemFinalPrice;
          monthlyMap[monthKey].net += takeHome;
          monthlyMap[monthKey].sales += 1;

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
          });
        }
      }
    }

    const totalPlatformFees = Math.round(totalGrossSales * 0.20 * 100) / 100;
    const totalLifetimeNetEarnings = Math.round(totalGrossSales * 0.80 * 100) / 100;

    // 3. Fetch instructor payout history
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
    const availableBalance = Math.max(0, Math.round((totalLifetimeNetEarnings - totalReservedOrWithdrawn) * 100) / 100);

    // Monthly earnings sorted chronologically
    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Course breakdown sorted by revenue
    const courseBreakdown = Object.values(courseMap)
      .map((c) => ({
        ...c,
        grossRevenue: Math.round(c.grossRevenue * 100) / 100,
        discountAbsorbed: Math.round(c.discountAbsorbed * 100) / 100,
        platformFee: Math.round(c.platformFee * 100) / 100,
        netEarnings: Math.round(c.netEarnings * 100) / 100,
      }))
      .sort((a, b) => b.netEarnings - a.netEarnings);

    return res.json({
      summary: {
        totalGrossSales: Math.round(totalGrossSales * 100) / 100,
        totalPlatformFees,
        totalLifetimeNetEarnings,
        totalPayoutsWithdrawn: Math.round(totalPayoutsWithdrawn * 100) / 100,
        pendingPayoutsAmount: Math.round(pendingPayoutsAmount * 100) / 100,
        availableBalance,
        totalCoursesCount: courses.length,
        totalUnitsSold: salesLedger.length,
      },
      courseBreakdown,
      monthlyTrend,
      payouts,
      recentSales: salesLedger.slice(0, 15),
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

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 50) {
      return res.status(400).json({ message: "Minimum payout withdrawal amount is $50.00" });
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

    let totalGrossSales = 0;
    const courseIdSet = new Set(courseIds.map((id) => id.toString()));

    for (const order of orders) {
      for (const item of order.items) {
        if (item.course && courseIdSet.has(item.course.toString())) {
          totalGrossSales += Number(item.finalPrice) || 0;
        }
      }
    }

    const totalLifetimeNetEarnings = Math.round(totalGrossSales * 0.80 * 100) / 100;

    const existingPayouts = await Payout.find({
      instructor: instructorId,
      status: { $in: ["pending", "processing", "completed"] },
    }).lean();

    const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
    const primaryCurrency = settings?.primaryCurrency || "USD";

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
      "Platform Fee 20% ($)",
      "Instructor Net 80% ($)",
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
          const fee = Math.round(itemFinalPrice * 0.20 * 100) / 100;
          const takeHome = Math.round(itemFinalPrice * 0.80 * 100) / 100;

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
