import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import LessonItem from "../../models/LessonItem";
import { isCourseManager } from "./shared";

export async function createLessonItem(req: Request, res: Response) {
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

    const { type, content, order } = req.body;
    if (!type || !content || typeof content !== "object") {
      return res.status(400).json({ message: "type and object content are required" });
    }

    let resolvedOrder = Number(order);
    if (!resolvedOrder || resolvedOrder < 1) {
      const lastItem = await LessonItem.findOne({ lesson: lesson._id }).sort({ order: -1 }).select("order");
      resolvedOrder = lastItem ? lastItem.order + 1 : 1;
    }

    const lessonItem = await LessonItem.create({
      lesson: lesson._id,
      type,
      content,
      order: resolvedOrder,
    });

    return res.status(201).json({ message: "Lesson item created", lessonItem });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
