import type { Request, Response } from "express";
import User from "../../models/User";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = isActive;
    await user.save();

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

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (isActive !== undefined) course.isActive = isActive;
    if (isApproved !== undefined) course.isApproved = isApproved;

    await course.save();

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
