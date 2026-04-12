import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course.js";
import Section from "../../models/Section.js";
import Lesson from "../../models/Lesson.js";
import Enrollment from "../../models/Enrollment.js";
import { isCourseManager } from "./shared.js";

export async function enrollInCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published") {
      return res.status(400).json({ message: "Course is not open for enrollment" });
    }

    const existing = await Enrollment.findOne({
      student: req.user.id,
      course: course._id,
    });
    if (existing) {
      return res.status(200).json({ message: "Already enrolled", enrollment: existing });
    }

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: course._id,
      status: "active",
    });

    return res.status(201).json({ message: "Enrollment created", enrollment });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getMyCourses(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const enrollments = await Enrollment.find({
      student: req.user.id,
      status: { $in: ["active", "completed"] },
    })
      .populate("course")
      .sort({ createdAt: -1 });

    return res.json({ enrollments });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourseEnrollments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const enrollments = await Enrollment.find({ course: course._id })
      .populate("student", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ enrollments });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateEnrollmentStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { enrollmentId } = req.params;
    if (!isValidObjectId(enrollmentId)) {
      return res.status(400).json({ message: "Invalid enrollment id" });
    }

    const { status } = req.body as { status?: "active" | "completed" | "dropped" };
    if (!status || !["active", "completed", "dropped"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const course = await Course.findById(enrollment.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const canManage =
      isCourseManager(req.user.id, req.user.role, course.instructor.toString()) ||
      enrollment.student.toString() === req.user.id;
    if (!canManage) {
      return res.status(403).json({ message: "Forbidden" });
    }

    enrollment.status = status;
    await enrollment.save();

    return res.json({ message: "Enrollment status updated", enrollment });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCurriculumForCourse(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published") {
      if (!req.user || !isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const sections = await Section.find({ course: course._id }).sort({ order: 1 });
    const sectionIds = sections.map((s) => s._id);
    const lessons = sectionIds.length
      ? await Lesson.find({ section: { $in: sectionIds } }).sort({ order: 1 })
      : [];

    return res.json({ sections, lessons });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
