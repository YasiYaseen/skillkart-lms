import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import Course from "../../models/Course";
import { syncEnrollmentLessonCount } from "./shared";
import { singleBulkLessonSchema } from "../../validators/bulkLesson.validator";

export async function bulkUploadLessons(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sectionId } = req.params;
    if (!isValidObjectId(sectionId)) {
      return res.status(400).json({ message: "Invalid sectionId" });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const course = await Course.findById(section.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const rawLessons = req.body.lessons;
    if (!Array.isArray(rawLessons) || rawLessons.length === 0) {
      return res.status(400).json({ message: "Payload must include a non-empty array of lessons" });
    }

    // Get current max order in this section
    const existingLessons = await Lesson.find({ section: sectionId }).sort({ order: -1 }).limit(1);
    let currentOrder = existingLessons.length > 0 ? existingLessons[0].order : 0;

    const createdLessons = [];
    const failedRows: Array<{ row: number; error: string; data: unknown }> = [];

    for (let i = 0; i < rawLessons.length; i++) {
      const rowNum = i + 1;
      const raw = rawLessons[i];
      const parsed = singleBulkLessonSchema.safeParse(raw);

      if (!parsed.success) {
        failedRows.push({
          row: rowNum,
          error: parsed.error.issues.map((err) => `${err.path.join(".")}: ${err.message}`).join(", "),
          data: raw,
        });
        continue;
      }

      currentOrder += 1;
      const lessonData = parsed.data;

      const sId = Array.isArray(sectionId) ? sectionId[0] : sectionId;
      const created = await Lesson.create({
        section: new Types.ObjectId(sId),
        title: lessonData.title,
        type: lessonData.type,
        durationMinutes: lessonData.durationMinutes,
        isPreview: lessonData.isPreview,
        isMandatory: lessonData.isMandatory,
        order: lessonData.order || currentOrder,
      });

      createdLessons.push(created);
    }

    if (createdLessons.length > 0) {
      await syncEnrollmentLessonCount(course._id.toString());
    }

    return res.status(201).json({
      message: `Successfully created ${createdLessons.length} lessons. ${failedRows.length} failed.`,
      createdCount: createdLessons.length,
      failedCount: failedRows.length,
      lessons: createdLessons,
      failedRows,
    });
  } catch (error) {
    console.error("Error in bulkUploadLessons:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
