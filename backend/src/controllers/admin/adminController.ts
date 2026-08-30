import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import User from "../../models/User";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";

import { recordAuditLog } from "../../services/auditService";
import AuditLog from "../../models/AuditLog";

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
    const { isActive, isApproved } = req.body;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const previousState = { isActive: course.isActive, isApproved: course.isApproved };

    if (isActive !== undefined) course.isActive = Boolean(isActive);
    if (isApproved !== undefined) course.isApproved = Boolean(isApproved);

    await course.save();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user.id,
        action: "COURSE_MODERATED",
        targetType: "course",
        targetId: course._id.toString(),
        targetName: course.title,
        details: {
          previousState,
          newState: { isActive: course.isActive, isApproved: course.isApproved },
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

