import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course.js";
import Section from "../../models/Section.js";
import Lesson from "../../models/Lesson.js";
import { isCourseManager } from "./shared.js";

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

    const { title, type, order, durationMinutes, isPreview, isMandatory } = req.body;
    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

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

    return res.status(201).json({ message: "Lesson created", lesson });
  } catch {
    return res.status(500).json({ message: "Server error" });
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
