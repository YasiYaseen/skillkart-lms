import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import User from "../../models/User";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";
import Notification from "../../models/Notification";
import Order from "../../models/Order";
import Coupon from "../../models/Coupon";
import Payout from "../../models/Payout";

import { recordAuditLog } from "../../services/auditService";
import AuditLog from "../../models/AuditLog";

interface PopulatedStudent {
  _id?: Types.ObjectId | string;
  name?: string;
  email?: string;
}

interface PopulatedInstructor {
  _id?: Types.ObjectId | string;
  name?: string;
  email?: string;
}

interface PopulatedCourse {
  _id?: Types.ObjectId | string;
  title?: string;
  instructor?: PopulatedInstructor;
}

export async function getStats(req: Request, res: Response) {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalInstructors = await User.countDocuments({ role: "instructor" });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    return res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function toggleUserStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    if (req.user && userId === req.user.id && !isActive) {
      return res.status(400).json({ message: "Admin cannot deactivate their own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user.id,
        action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        targetType: "user",
        targetId: user._id.toString(),
        targetName: user.name,
        details: { email: user.email, role: user.role, previousStatus, newStatus: isActive },
        req,
      });
    }

    return res.json({ message: "User status updated", user: { _id: user._id, isActive: user.isActive } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourses(req: Request, res: Response) {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ courses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourseStatus(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    const { isActive, isApproved, rejectionReason } = req.body;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const previousState = { isActive: course.isActive, isApproved: course.isApproved, rejectionReason: course.rejectionReason };

    if (isActive !== undefined) course.isActive = Boolean(isActive);
    if (isApproved !== undefined) {
      course.isApproved = Boolean(isApproved);
      if (course.isApproved) {
        course.rejectionReason = undefined;
      } else if (typeof rejectionReason === "string" && rejectionReason.trim()) {
        course.rejectionReason = rejectionReason.trim();
      }
    }

    await course.save();

    // Trigger instructor notification
    if (isApproved !== undefined) {
      try {
        if (isApproved) {
          await Notification.create({
            recipient: course.instructor,
            title: "Course Approved",
            message: `Your course "${course.title}" has been reviewed and approved by administrators.`,
            type: "success",
            link: `/courses/${course._id}`,
          });
        } else {
          await Notification.create({
            recipient: course.instructor,
            title: "Course Submission Rejected",
            message: `Your course "${course.title}" was not approved.${course.rejectionReason ? ` Reason: ${course.rejectionReason}` : ''}`,
            type: "warning",
            link: `/instructor/courses/${course._id}/edit`,
          });
        }
      } catch (notifErr) {
        console.error("Failed to send course moderation notification:", notifErr);
      }
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user.id,
        action: "COURSE_MODERATED",
        targetType: "course",
        targetId: course._id.toString(),
        targetName: course.title,
        details: {
          previousState,
          newState: { isActive: course.isActive, isApproved: course.isApproved, rejectionReason: course.rejectionReason },
        },
        req,
      });
    }

    return res.json({ message: "Course status updated", course });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getEnrollments(req: Request, res: Response) {
  try {
    const enrollments = await Enrollment.find()
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ enrollments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getFinancialReports(req: Request, res: Response) {
  try {
    const { range = "30d", startDate: customStart, endDate: customEnd } = req.query as {
      range?: string;
      startDate?: string;
      endDate?: string;
    };

    let start: Date | null = null;
    let end: Date = customEnd ? new Date(customEnd) : new Date();

    const now = new Date();
    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "7d") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90d") {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === "1y") {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (range === "custom" && customStart) {
      start = new Date(customStart);
    }

    const orderFilter: Record<string, unknown> = {
      paymentStatus: "completed",
    };

    if (start) {
      orderFilter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(orderFilter)
      .populate("student", "name email")
      .populate({
        path: "items.course",
        select: "title instructor price",
        populate: { path: "instructor", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Summary calculations
    let grossVolume = 0;
    let totalDiscount = 0;
    let totalSubtotal = 0;
    let totalPlatformCommission = 0;
    let totalInstructorPayouts = 0;
    const paymentMethodsCount: Record<string, { count: number; volume: number }> = {};
    const coursesMap: Record<string, { title: string; unitsSold: number; revenue: number; instructorName: string }> = {};
    const instructorsMap: Record<string, { name: string; email: string; unitsSold: number; grossRevenue: number; estimatedPayout: number }> = {};
    const timeSeriesMap: Record<string, { date: string; revenue: number; count: number; discounts: number }> = {};

    for (const order of orders) {
      const orderTotal = Number(order.totalAmount) || 0;
      const orderDiscount = Number(order.discountTotal) || 0;
      const orderSub = Number(order.subtotal) || orderTotal + orderDiscount;

      grossVolume += orderTotal;
      totalDiscount += orderDiscount;
      totalSubtotal += orderSub;

      // Payment method breakdown
      const method = order.paymentMethod || "card";
      if (!paymentMethodsCount[method]) {
        paymentMethodsCount[method] = { count: 0, volume: 0 };
      }
      paymentMethodsCount[method].count += 1;
      paymentMethodsCount[method].volume += orderTotal;

      // Time series (grouped by YYYY-MM-DD)
      const dayKey = new Date(order.createdAt).toISOString().split("T")[0];
      if (!timeSeriesMap[dayKey]) {
        timeSeriesMap[dayKey] = { date: dayKey, revenue: 0, count: 0, discounts: 0 };
      }
      timeSeriesMap[dayKey].revenue += orderTotal;
      timeSeriesMap[dayKey].count += 1;
      timeSeriesMap[dayKey].discounts += orderDiscount;

      // Course and Instructor rankings
      for (const item of order.items) {
        const itemPrice = Number(item.finalPrice) || 0;
        const populatedCourse = (item.course && typeof item.course === "object" ? item.course : null) as PopulatedCourse | null;
        const courseIdStr = populatedCourse?._id ? populatedCourse._id.toString() : (item.course ? item.course.toString() : "unknown");
        const courseTitle = item.title || populatedCourse?.title || "Untitled Course";

        let instructorName = "SkillKart Instructor";
        let instructorEmail = "";
        let instructorId = "platform";

        if (populatedCourse?.instructor && typeof populatedCourse.instructor === "object") {
          const inst = populatedCourse.instructor;
          if (inst._id) {
            instructorId = inst._id.toString();
            instructorName = inst.name || "Instructor";
            instructorEmail = inst.email || "";
          }
        }

        // Aggregate Course
        if (!coursesMap[courseIdStr]) {
          coursesMap[courseIdStr] = { title: courseTitle, unitsSold: 0, revenue: 0, instructorName };
        }
        coursesMap[courseIdStr].unitsSold += 1;
        coursesMap[courseIdStr].revenue += itemPrice;

        // Aggregate Instructor
        const itemTakeHome = typeof item.instructorPayout === "number"
          ? item.instructorPayout
          : Math.round(itemPrice * 0.80 * 100) / 100;
        const itemFee = typeof item.platformFee === "number"
          ? item.platformFee
          : Math.round((itemPrice - itemTakeHome) * 100) / 100;

        totalPlatformCommission += itemFee;
        totalInstructorPayouts += itemTakeHome;

        if (!instructorsMap[instructorId]) {
          instructorsMap[instructorId] = { name: instructorName, email: instructorEmail, unitsSold: 0, grossRevenue: 0, estimatedPayout: 0 };
        }
        instructorsMap[instructorId].unitsSold += 1;
        instructorsMap[instructorId].grossRevenue += itemPrice;
        instructorsMap[instructorId].estimatedPayout += itemTakeHome;
      }
    }

    const totalOrdersCount = orders.length;
    const averageOrderValue = totalOrdersCount > 0 ? Math.round((grossVolume / totalOrdersCount) * 100) / 100 : 0;
    const platformCommission = Math.round(totalPlatformCommission * 100) / 100;
    const instructorPayouts = Math.round(totalInstructorPayouts * 100) / 100;

    // Sort time series chronologically
    const timeSeries = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date));

    // Sort top courses by revenue
    const topCourses = Object.entries(coursesMap)
      .map(([id, data]) => ({ courseId: id, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // Sort top instructors by gross revenue
    const topInstructors = Object.entries(instructorsMap)
      .map(([id, data]) => ({
        instructorId: id,
        name: data.name,
        email: data.email,
        unitsSold: data.unitsSold,
        grossRevenue: Math.round(data.grossRevenue * 100) / 100,
        estimatedPayout: Math.round(data.estimatedPayout * 100) / 100,
      }))
      .sort((a, b) => b.grossRevenue - a.grossRevenue)
      .slice(0, 6);

    // Format recent transactions
    const recentTransactions = orders.slice(0, 15).map((o) => {
      const student = (o.student && typeof o.student === "object" ? o.student : null) as PopulatedStudent | null;
      const billing = o.paymentMetadata && typeof o.paymentMetadata === "object" && "billingDetails" in o.paymentMetadata
        ? (o.paymentMetadata.billingDetails as { name?: string; email?: string } | undefined)
        : undefined;

      return {
        _id: o._id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        customerName: student?.name || billing?.name || "Student",
        customerEmail: student?.email || billing?.email || "",
        itemsCount: o.items.length,
        coursesSummary: o.items.map((i) => i.title).join(", "),
        subtotal: o.subtotal,
        discountTotal: o.discountTotal,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        transactionId: o.transactionId,
      };
    });

    return res.json({
      range,
      startDate: start,
      endDate: end,
      metrics: {
        grossVolume: Math.round(grossVolume * 100) / 100,
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        platformCommission,
        instructorPayouts,
        totalOrdersCount,
        averageOrderValue,
      },
      timeSeries,
      topCourses,
      topInstructors,
      paymentMethodsBreakdown: paymentMethodsCount,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error in getFinancialReports:", error);
    return res.status(500).json({ message: "Failed to generate financial reports" });
  }
}

export async function exportFinancialsCsv(req: Request, res: Response) {
  try {
    const orders = await Order.find({ paymentStatus: "completed" })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Courses Purchased",
      "Original Price ($)",
      "Discount ($)",
      "Total Paid ($)",
      "Payment Method",
      "Status",
      "Transaction ID",
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [headers.join(",")];

    for (const o of orders) {
      const coursesStr = o.items.map((i) => i.title).join(" | ");
      const student = (o.student && typeof o.student === "object" ? o.student : null) as PopulatedStudent | null;
      const billing = o.paymentMetadata && typeof o.paymentMetadata === "object" && "billingDetails" in o.paymentMetadata
        ? (o.paymentMetadata.billingDetails as { name?: string; email?: string } | undefined)
        : undefined;

      const row = [
        escapeCsv(o.orderNumber),
        escapeCsv(new Date(o.createdAt).toISOString()),
        escapeCsv(student?.name || billing?.name || "Student"),
        escapeCsv(student?.email || billing?.email || ""),
        escapeCsv(coursesStr),
        escapeCsv((o.subtotal || 0).toFixed(2)),
        escapeCsv((o.discountTotal || 0).toFixed(2)),
        escapeCsv((o.totalAmount || 0).toFixed(2)),
        escapeCsv(o.paymentMethod || "card"),
        escapeCsv(o.paymentStatus),
        escapeCsv(o.transactionId || ""),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const filename = `skillkart-financial-report-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting financial CSV:", error);
    return res.status(500).json({ message: "Failed to export financial CSV" });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { action, targetType } = req.query as { action?: string; targetType?: string };
    const filter: Record<string, unknown> = {};

    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const logs = await AuditLog.find(filter)
      .populate("admin", "name email role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ logs });
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getPayoutRequests(req: Request, res: Response) {
  try {
    const { status, search } = req.query as { status?: string; search?: string };
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const allPayouts = await Payout.find()
      .populate("instructor", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    let pendingCount = 0;
    let pendingAmount = 0;
    let processingCount = 0;
    let processingAmount = 0;
    let completedCount = 0;
    let completedAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;

    for (const p of allPayouts) {
      const amt = Number(p.amount) || 0;
      if (p.status === "pending") {
        pendingCount += 1;
        pendingAmount += amt;
      } else if (p.status === "processing") {
        processingCount += 1;
        processingAmount += amt;
      } else if (p.status === "completed") {
        completedCount += 1;
        completedAmount += amt;
      } else if (p.status === "rejected") {
        rejectedCount += 1;
        rejectedAmount += amt;
      }
    }

    let payouts = await Payout.find(filter)
      .populate("instructor", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      payouts = payouts.filter((p) => {
        const inst = p.instructor as { name?: string; email?: string } | null;
        const refMatch = p.referenceNumber?.toLowerCase().includes(q);
        const nameMatch = inst?.name?.toLowerCase().includes(q);
        const emailMatch = inst?.email?.toLowerCase().includes(q);
        return refMatch || nameMatch || emailMatch;
      });
    }

    return res.json({
      payouts,
      summary: {
        pending: { count: pendingCount, amount: Math.round(pendingAmount * 100) / 100 },
        processing: { count: processingCount, amount: Math.round(processingAmount * 100) / 100 },
        completed: { count: completedCount, amount: Math.round(completedAmount * 100) / 100 },
        rejected: { count: rejectedCount, amount: Math.round(rejectedAmount * 100) / 100 },
        totalCount: allPayouts.length,
      },
    });
  } catch (error) {
    console.error("Error in getPayoutRequests:", error);
    return res.status(500).json({ message: "Failed to fetch payout requests" });
  }
}

export async function updatePayoutStatus(req: Request, res: Response) {
  try {
    const { payoutId } = req.params;
    const { status, notes } = req.body as { status: "pending" | "processing" | "completed" | "rejected"; notes?: string };

    if (!isValidObjectId(payoutId)) {
      return res.status(400).json({ message: "Invalid payout ID" });
    }

    if (!["pending", "processing", "completed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const payout = await Payout.findById(payoutId).populate("instructor", "name email");
    if (!payout) {
      return res.status(404).json({ message: "Payout request not found" });
    }

    const previousStatus = payout.status;
    payout.status = status;
    if (typeof notes === "string") {
      payout.notes = notes.trim();
    }
    if (status === "completed" || status === "rejected") {
      payout.processedAt = new Date();
    }
    await payout.save();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user.id,
        action: "PAYOUT_STATUS_UPDATED",
        targetType: "payout",
        targetId: payout._id.toString(),
        targetName: `Payout #${payout.referenceNumber}`,
        details: {
          previousStatus,
          newStatus: status,
          amount: payout.amount,
          instructorId: payout.instructor ? (payout.instructor as any)._id?.toString() || payout.instructor.toString() : "",
          notes,
        },
        req,
      });
    }

    try {
      const instructorId = (payout.instructor as any)?._id || payout.instructor;
      if (instructorId) {
        let title = "Payout Processing";
        let notifType: "info" | "success" | "warning" = "info";
        if (status === "completed") {
          title = "Payout Disbursed";
          notifType = "success";
        }
        if (status === "rejected") {
          title = "Payout Request Rejected";
          notifType = "warning";
        }

        await Notification.create({
          recipient: instructorId,
          title,
          message: `Your withdrawal request #${payout.referenceNumber} for $${payout.amount} is now ${status}.${notes ? ` Note: ${notes}` : ""}`,
          type: notifType,
          link: "/instructor/earnings",
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify instructor regarding payout status:", notifErr);
    }

    return res.json({
      message: `Payout request #${payout.referenceNumber} marked as ${status}`,
      payout,
    });
  } catch (error) {
    console.error("Error in updatePayoutStatus:", error);
    return res.status(500).json({ message: "Failed to update payout status" });
  }
}

export async function exportPayoutsCsv(req: Request, res: Response) {
  try {
    const { status } = req.query as { status?: string };
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const payouts = await Payout.find(filter)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const csvRows: string[] = [];
    csvRows.push(
      [
        "Reference Number",
        "Requested Date",
        "Instructor Name",
        "Instructor Email",
        "Amount",
        "Currency",
        "Method",
        "Bank Name",
        "Account Holder Name",
        "Account Number / IBAN",
        "Routing / SWIFT",
        "PayPal Email",
        "Stripe Account ID",
        "Status",
        "Processed Date",
        "Notes",
      ].join(",")
    );

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    for (const p of payouts) {
      const inst = (p.instructor && typeof p.instructor === "object" ? p.instructor : null) as { name?: string; email?: string } | null;
      const acc = p.accountDetails || {};

      const row = [
        escapeCsv(p.referenceNumber),
        escapeCsv(new Date(p.createdAt).toISOString()),
        escapeCsv(inst?.name || "Instructor"),
        escapeCsv(inst?.email || ""),
        escapeCsv((p.amount || 0).toFixed(2)),
        escapeCsv(p.currency || "USD"),
        escapeCsv(p.method),
        escapeCsv(acc.bankName || ""),
        escapeCsv(acc.accountHolderName || ""),
        escapeCsv(acc.accountNumber || ""),
        escapeCsv(acc.routingNumber || ""),
        escapeCsv(acc.paypalEmail || ""),
        escapeCsv(acc.stripeAccountId || ""),
        escapeCsv(p.status),
        escapeCsv(p.processedAt ? new Date(p.processedAt).toISOString() : ""),
        escapeCsv(p.notes || ""),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const filename = `skillkart-payouts-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting payouts CSV:", error);
    return res.status(500).json({ message: "Failed to export payouts CSV" });
  }
}




