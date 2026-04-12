import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import LessonItem from "../../models/LessonItem";
import Enrollment from "../../models/Enrollment";
import LessonProgress from "../../models/LessonProgress";
import { getCourseDurationMinutes, isCourseManager } from "./shared";
import { createCourseSchema } from "../../validators/course.validator";

export async function createCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const parsed = createCourseSchema.safeParse(req.body);
    // ddss
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    if (data.isPaid && (!data.price || data.price <= 0)) {
      return res.status(400).json({
        message: "Valid price required for paid course",
      });
    }

    const course = await Course.create({
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl || undefined,
      level: data.level || "beginner",
      isPaid: data.isPaid,
      price: data.isPaid ? data.price : null,
      instructor: req.user.id,
      status: "draft",
    });

    return res.status(201).json({
      message: "Course created",
      course,
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourses(req: Request, res: Response) {
  try {
    const { q, level, mine } = req.query as { q?: string; level?: string; mine?: string };
    const filter: Record<string, unknown> = {};

    if (mine === "true") {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (req.user.role === "instructor") {
        filter.instructor = req.user.id;
      }
    } else {
      filter.status = "published";
    }

    if (level) {
      filter.level = level;
    }

    if (q) {
      filter.$text = { $search: q };
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const durationMinutes = await getCourseDurationMinutes(course._id.toString());
        return { ...course, durationMinutes };
      })
    );

    return res.json({ courses: enriched });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId).populate("instructor", "name email").lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published") {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!isCourseManager(req.user.id, req.user.role, course.instructor._id.toString())) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const sections = await Section.find({ course: course._id }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((section) => section._id);
    const lessons = sectionIds.length
      ? await Lesson.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
      : [];
    const lessonIds = lessons.map((lesson) => lesson._id);
    const lessonItems = lessonIds.length
      ? await LessonItem.find({ lesson: { $in: lessonIds } }).sort({ order: 1 }).lean()
      : [];

    const durationMinutes = lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0);

    return res.json({
      course: {
        ...course,
        durationMinutes,
        sections,
        lessons,
        lessonItems,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourse(req: Request, res: Response) {
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

    const allowed = ["title", "description", "thumbnailUrl", "level", "isPaid", "price", "status"];
    for (const field of allowed) {
      if (field in req.body) {
        (course as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    if (!course.isPaid) {
      course.price = null;
    }
    if (course.isPaid && (course.price === null || course.price === undefined)) {
      return res.status(400).json({ message: "price is required for paid courses" });
    }

    await course.save();
    return res.json({ message: "Course updated", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function publishCourse(req: Request, res: Response) {
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

    const hasSection = await Section.exists({ course: course._id });
    if (!hasSection) {
      return res.status(400).json({ message: "Cannot publish a course without sections" });
    }

    course.status = "published";
    course.publishedAt = new Date();
    await course.save();

    return res.json({ message: "Course published", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function unpublishCourse(req: Request, res: Response) {
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

    course.status = "draft";
    course.publishedAt = undefined;
    await course.save();

    return res.json({ message: "Course moved to draft", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function archiveCourse(req: Request, res: Response) {
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

    course.status = "archived";
    await course.save();

    return res.json({ message: "Course archived", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
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

    const sections = await Section.find({ course: course._id }).select("_id");
    const sectionIds = sections.map((section) => section._id);
    const lessons = sectionIds.length ? await Lesson.find({ section: { $in: sectionIds } }).select("_id") : [];
    const lessonIds = lessons.map((lesson) => lesson._id);

    await LessonProgress.deleteMany({ lesson: { $in: lessonIds } });
    await LessonItem.deleteMany({ lesson: { $in: lessonIds } });
    await Lesson.deleteMany({ section: { $in: sectionIds } });
    await Section.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await Course.deleteOne({ _id: course._id });

    return res.json({ message: "Course deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
