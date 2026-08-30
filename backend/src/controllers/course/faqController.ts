import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import CourseFAQ from "../../models/CourseFAQ";
import Course from "../../models/Course";
import { createFAQSchema, updateFAQSchema } from "../../validators/faq.validator";

export async function getCourseFAQs(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const faqs = await CourseFAQ.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).lean();
    return res.json({ faqs });
  } catch (error) {
    console.error("Error in getCourseFAQs:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createCourseFAQ(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = createFAQSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const count = await CourseFAQ.countDocuments({ course: courseId });
    const order = parsed.data.order !== undefined ? parsed.data.order : count + 1;

    const cId = Array.isArray(courseId) ? courseId[0] : courseId;
    const faq = await CourseFAQ.create({
      course: new Types.ObjectId(cId),
      question: parsed.data.question,
      answer: parsed.data.answer,
      order,
    });

    return res.status(201).json({
      message: "FAQ created successfully",
      faq,
    });
  } catch (error) {
    console.error("Error in createCourseFAQ:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourseFAQ(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId, faqId } = req.params;
    if (!isValidObjectId(courseId) || !isValidObjectId(faqId)) {
      return res.status(400).json({ message: "Invalid ID parameter" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = updateFAQSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const faq = await CourseFAQ.findOneAndUpdate(
      { _id: faqId, course: courseId },
      { $set: parsed.data },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    return res.json({
      message: "FAQ updated successfully",
      faq,
    });
  } catch (error) {
    console.error("Error in updateCourseFAQ:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCourseFAQ(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId, faqId } = req.params;
    if (!isValidObjectId(courseId) || !isValidObjectId(faqId)) {
      return res.status(400).json({ message: "Invalid ID parameter" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deleted = await CourseFAQ.findOneAndDelete({ _id: faqId, course: courseId });
    if (!deleted) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    return res.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCourseFAQ:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
