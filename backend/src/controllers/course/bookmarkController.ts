import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Bookmark from "../../models/Bookmark";
import Lesson from "../../models/Lesson";
import Section from "../../models/Section";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";

function getParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

async function getLessonDetails(lessonId: string) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return null;

  const section = await Section.findById(lesson.section).select("course");
  if (!section) return null;

  const course = await Course.findById(section.course).select("_id title instructor status");
  if (!course) return null;

  return { lesson, section, course };
}

async function canAccessLesson(courseId: Types.ObjectId | string, userId: string, role: string, instructorId: Types.ObjectId | string) {
  if (role === "admin" || instructorId.toString() === userId) {
    return true;
  }

  const enrollment = await Enrollment.exists({
    student: userId,
    course: courseId,
    status: "active",
  });

  return Boolean(enrollment);
}

// ---------------------------------------------------------------------------
// GET /api/lessons/:lessonId/bookmark
// ---------------------------------------------------------------------------
export async function getLessonBookmarkStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = getParam(req.params.lessonId);
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const existing = await Bookmark.exists({
      user: req.user.id,
      lesson: lessonId,
    });

    return res.json({ bookmarked: Boolean(existing) });
  } catch (error) {
    console.error("Error in getLessonBookmarkStatus:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/lessons/:lessonId/bookmark
// ---------------------------------------------------------------------------
export async function toggleLessonBookmark(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = getParam(req.params.lessonId);
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const details = await getLessonDetails(lessonId);
    if (!details) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const hasAccess = await canAccessLesson(
      details.course._id,
      req.user.id,
      req.user.role,
      details.course.instructor
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You must be actively enrolled in this course to bookmark lessons.",
      });
    }

    const existing = await Bookmark.findOne({
      user: req.user.id,
      lesson: lessonId,
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({
        bookmarked: false,
        message: "Bookmark removed",
      });
    }

    const bookmark = await Bookmark.create({
      user: new Types.ObjectId(req.user.id),
      course: details.course._id,
      lesson: new Types.ObjectId(lessonId),
    });

    return res.status(201).json({
      bookmarked: true,
      message: "Lesson bookmarked successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Error in toggleLessonBookmark:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/me/courses/:courseId/bookmarks
// ---------------------------------------------------------------------------
export async function getCourseBookmarks(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getParam(req.params.courseId);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const bookmarks = await Bookmark.find({
      course: courseId,
      user: req.user.id,
    })
      .populate("lesson", "title order section durationMinutes type isPreview")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ bookmarks });
  } catch (error) {
    console.error("Error in getCourseBookmarks:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/me/bookmarks
// ---------------------------------------------------------------------------
export async function getAllUserBookmarks(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate("course", "title thumbnail")
      .populate("lesson", "title order section durationMinutes type isPreview")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ bookmarks });
  } catch (error) {
    console.error("Error in getAllUserBookmarks:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
