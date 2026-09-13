import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import LessonItem from "../../models/LessonItem";
import LessonProgress from "../../models/LessonProgress";
import Comment from "../../models/Comment";
import Quiz from "../../models/Quiz";
import QuizAttempt from "../../models/QuizAttempt";
import Note from "../../models/Note";
import Bookmark from "../../models/Bookmark";
import Enrollment from "../../models/Enrollment";
import Assignment from "../../models/Assignment";
import { isCourseManager, syncEnrollmentLessonCount } from "./shared";
import { createSectionSchema } from "../../validators/content.validator";

export async function createSection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId).select("instructor").lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsed = createSectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { title, order, isLocked, prerequisiteSectionId } = parsed.data;

    if (prerequisiteSectionId && !isValidObjectId(prerequisiteSectionId)) {
      return res.status(400).json({ message: "Invalid prerequisite section id" });
    }

    let resolvedOrder = Number(order);
    const needOrder = !resolvedOrder || resolvedOrder < 1;

    const [lastSection, prerequisiteExists] = await Promise.all([
      needOrder
        ? Section.findOne({ course: course._id }).sort({ order: -1 }).select("order").lean()
        : null,
      prerequisiteSectionId
        ? Section.exists({ _id: prerequisiteSectionId, course: course._id })
        : Promise.resolve(true),
    ]);

    if (prerequisiteSectionId && !prerequisiteExists) {
      return res.status(400).json({ message: "Prerequisite section must belong to this course" });
    }

    if (needOrder) {
      resolvedOrder = lastSection ? lastSection.order + 1 : 1;
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

    const course = await Course.findById(section.course).select("instructor").lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, order, isLocked, prerequisiteSection } = req.body;
    if (title !== undefined) {
      const trimmed = typeof title === "string" ? title.trim() : "";
      if (trimmed.length < 2 || trimmed.length > 200) {
        return res.status(400).json({ message: "Title must be between 2 and 200 characters" });
      }
      section.title = trimmed;
    }
    if (order !== undefined) {
      const orderNum = Number(order);
      if (Number.isInteger(orderNum) && orderNum >= 1) {
        section.order = orderNum;
      }
    }
    if (isLocked !== undefined) {
      section.isLocked = Boolean(isLocked);
    }
    if ("prerequisiteSection" in req.body) {
      if (prerequisiteSection && prerequisiteSection !== "") {
        if (!isValidObjectId(prerequisiteSection)) {
          return res.status(400).json({ message: "Invalid prerequisite section id" });
        }
        if (prerequisiteSection.toString() === section._id.toString()) {
          return res.status(400).json({ message: "Section cannot have itself as a prerequisite" });
        }
        const prereqExists = await Section.exists({
          _id: prerequisiteSection,
          course: section.course,
        });
        if (!prereqExists) {
          return res.status(400).json({ message: "Prerequisite section must belong to this course" });
        }
        section.prerequisiteSection = prerequisiteSection;
      } else {
        section.prerequisiteSection = undefined;
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

    const lessons = await Lesson.find({ section: section._id }).select("_id").lean();
    const lessonIds = lessons.map((lesson) => lesson._id);

    // AUDIT-47: Comprehensive section deletion cascade
    await Promise.all([
      lessonIds.length ? LessonProgress.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      lessonIds.length ? LessonItem.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      lessonIds.length ? Comment.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      lessonIds.length ? Quiz.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      lessonIds.length ? QuizAttempt.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      lessonIds.length ? Note.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      lessonIds.length ? Bookmark.deleteMany({ lesson: { $in: lessonIds } }) : Promise.resolve(),
      Lesson.deleteMany({ section: section._id }),
      Assignment.updateMany({ section: section._id }, { $unset: { section: 1 } }),
    ]);

    await Section.deleteOne({ _id: section._id });

    // Clean up dangling prerequisites on sibling sections
    await Section.updateMany(
      { course: section.course, prerequisiteSection: section._id },
      { $unset: { prerequisiteSection: 1 } }
    );

    // Pull deleted lesson IDs from enrolled students' completed list and unset lastAccessedLessonId
    if (lessonIds.length > 0) {
      await Promise.all([
        Enrollment.updateMany(
          { course: section.course },
          { $pull: { completedLessonIds: { $in: lessonIds } } }
        ),
        Enrollment.updateMany(
          { course: section.course, lastAccessedLessonId: { $in: lessonIds } },
          { $unset: { lastAccessedLessonId: 1 } }
        ),
      ]);
    }

    // Re-index remaining sections to maintain contiguous 1-based order
    const remainingSections = await Section.find({ course: section.course })
      .sort({ order: 1 })
      .select("_id")
      .lean();

    if (remainingSections.length > 0) {
      await Section.bulkWrite(
        remainingSections.map((sec, index) => ({
          updateOne: {
            filter: { _id: sec._id, course: section.course },
            update: { $set: { order: -(index + 1) } },
          },
        }))
      );
      await Section.bulkWrite(
        remainingSections.map((sec, index) => ({
          updateOne: {
            filter: { _id: sec._id, course: section.course },
            update: { $set: { order: index + 1 } },
          },
        }))
      );
    }

    // Sync totalLessonsCount across all enrollments
    if (section.course) {
      await syncEnrollmentLessonCount(section.course.toString());
    }

    return res.json({ message: "Section deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function reorderSections(req: Request, res: Response) {
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

    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({ message: "sectionIds must be a non-empty array" });
    }

    for (const id of sectionIds) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: `Invalid section ID: ${id}` });
      }
    }

    // Verify all sections exist and belong to this course
    const existingSections = await Section.find({
      _id: { $in: sectionIds },
      course: course._id,
    });

    if (existingSections.length !== sectionIds.length) {
      return res.status(400).json({ message: "One or more sections do not belong to this course" });
    }

    // Two-pass update to prevent unique compound index collision ({ course: 1, order: 1 })
    // Pass 1: Set temporary negative order indices
    await Section.bulkWrite(
      sectionIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, course: course._id },
          update: { $set: { order: -(index + 1) } },
        },
      }))
    );

    // Pass 2: Set final positive order indices (1-based)
    await Section.bulkWrite(
      sectionIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, course: course._id },
          update: { $set: { order: index + 1 } },
        },
      }))
    );

    const updatedSections = await Section.find({ course: course._id }).sort({ order: 1 });
    return res.json({ message: "Sections reordered successfully", sections: updatedSections });
  } catch (error) {
    console.error("reorderSections error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

