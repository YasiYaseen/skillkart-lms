import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import LessonItem from "../../models/LessonItem";
import LessonProgress from "../../models/LessonProgress";
import { isCourseManager } from "./shared";

export async function createSection(req: Request, res: Response) {
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

    const { title, order, isLocked, prerequisiteSectionId } = req.body;
    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    let resolvedOrder = Number(order);
    if (!resolvedOrder || resolvedOrder < 1) {
      const lastSection = await Section.findOne({ course: course._id }).sort({ order: -1 }).select("order");
      resolvedOrder = lastSection ? lastSection.order + 1 : 1;
    }

    if (prerequisiteSectionId && !isValidObjectId(prerequisiteSectionId)) {
      return res.status(400).json({ message: "Invalid prerequisite section id" });
    }

    if (prerequisiteSectionId) {
      const prerequisiteExists = await Section.exists({
        _id: prerequisiteSectionId,
        course: course._id,
      });
      if (!prerequisiteExists) {
        return res.status(400).json({ message: "Prerequisite section must belong to this course" });
      }
    }

    const section = await Section.create({
      course: course._id,
      title,
      order: resolvedOrder,
      isLocked: Boolean(isLocked),
      prerequisiteSection: prerequisiteSectionId || undefined,
    });

    return res.status(201).json({ message: "Section created", section });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateSection(req: Request, res: Response) {
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

    const allowed = ["title", "order", "isLocked", "prerequisiteSection"];
    for (const field of allowed) {
      if (field in req.body) {
        (section as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    await section.save();
    return res.json({ message: "Section updated", section });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteSection(req: Request, res: Response) {
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

    const lessons = await Lesson.find({ section: section._id }).select("_id");
    const lessonIds = lessons.map((lesson) => lesson._id);

    await LessonProgress.deleteMany({ lesson: { $in: lessonIds } });
    await LessonItem.deleteMany({ lesson: { $in: lessonIds } });
    await Lesson.deleteMany({ section: section._id });
    await Section.deleteOne({ _id: section._id });

    return res.json({ message: "Section deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
