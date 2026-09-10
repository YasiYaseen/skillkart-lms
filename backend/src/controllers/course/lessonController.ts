import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import { isCourseManager, syncEnrollmentLessonCount } from "./shared";
import { createLessonSchema } from "../../validators/content.validator";

export async function createLesson(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sectionId } = req.params;
    if (!isValidObjectId(sectionId)) {
      return res.status(400).json({ message: "Invalid section id" });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsed = createLessonSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { title, type, order, durationMinutes, isPreview, isMandatory } = parsed.data;

    let resolvedOrder = Number(order);
    if (!resolvedOrder || resolvedOrder < 1) {
      const lastLesson = await Lesson.findOne({ section: section._id }).sort({ order: -1 }).select("order");
      resolvedOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      section: section._id,
      title,
      type: type || "video",
      order: resolvedOrder,
      durationMinutes: Number(durationMinutes || 0),
      isPreview: Boolean(isPreview),
      isMandatory: isMandatory !== false,
    });

    await syncEnrollmentLessonCount(course._id.toString());

    return res.status(201).json({ message: "Lesson created", lesson });
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Server error"
    });
  }
}

export async function updateLesson(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { lessonId } = req.params;
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const section = await Section.findById(lesson.section);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = ["title", "type", "order", "durationMinutes", "isPreview", "isMandatory"];
    for (const field of allowed) {
      if (field in req.body) {
        (lesson as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    await lesson.save();
    return res.json({ message: "Lesson updated", lesson });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteLesson(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { lessonId } = req.params;
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const section = await Section.findById(lesson.section);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Lesson.findByIdAndDelete(lessonId);
    await syncEnrollmentLessonCount(course._id.toString());

    return res.json({ message: "Lesson deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function reorderLessons(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sectionId } = req.params;
    if (!isValidObjectId(sectionId)) {
      return res.status(400).json({ message: "Invalid section id" });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { lessonIds } = req.body;
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ message: "lessonIds must be a non-empty array" });
    }

    for (const id of lessonIds) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: `Invalid lesson ID: ${id}` });
      }
    }

    // Verify all lessons exist and belong to this section
    const existingLessons = await Lesson.find({
      _id: { $in: lessonIds },
      section: section._id,
    });

    if (existingLessons.length !== lessonIds.length) {
      return res.status(400).json({ message: "One or more lessons do not belong to this section" });
    }

    // Two-pass update to prevent unique compound index collision ({ section: 1, order: 1 })
    // Pass 1: Set temporary negative order indices
    await Lesson.bulkWrite(
      lessonIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, section: section._id },
          update: { $set: { order: -(index + 1) } },
        },
      }))
    );

    // Pass 2: Set final positive order indices (1-based)
    await Lesson.bulkWrite(
      lessonIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, section: section._id },
          update: { $set: { order: index + 1 } },
        },
      }))
    );

    const updatedLessons = await Lesson.find({ section: section._id }).sort({ order: 1 });
    return res.json({ message: "Lessons reordered successfully", lessons: updatedLessons });
  } catch (error) {
    console.error("reorderLessons error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

