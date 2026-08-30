import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Note from "../../models/Note";
import Lesson from "../../models/Lesson";
import Section from "../../models/Section";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";
import { noteSchema, updateNoteSchema } from "../../validators/note.validator";

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
    status: { $in: ["active", "completed"] },
  });

  return Boolean(enrollment);
}

// ---------------------------------------------------------------------------
// GET /api/lessons/:lessonId/notes
// ---------------------------------------------------------------------------
export async function getLessonNotes(req: Request, res: Response) {
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
        message: "You must be enrolled in this course to access notes.",
      });
    }

    const notes = await Note.find({
      lesson: lessonId,
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ notes });
  } catch (error) {
    console.error("Error in getLessonNotes:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/lessons/:lessonId/notes
// ---------------------------------------------------------------------------
export async function createLessonNote(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = getParam(req.params.lessonId);
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
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
        message: "You must be enrolled in this course to create notes.",
      });
    }

    const note = await Note.create({
      user: new Types.ObjectId(req.user.id),
      course: details.course._id,
      lesson: new Types.ObjectId(lessonId),
      content: parsed.data.content,
    });

    return res.status(201).json({
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Error in createLessonNote:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/notes/:noteId
// ---------------------------------------------------------------------------
export async function updateNote(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const noteId = getParam(req.params.noteId);
    if (!isValidObjectId(noteId)) {
      return res.status(400).json({ message: "Invalid note id" });
    }

    const parsed = updateNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to edit this note." });
    }

    note.content = parsed.data.content;
    await note.save();

    return res.json({
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Error in updateNote:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/notes/:noteId
// ---------------------------------------------------------------------------
export async function deleteNote(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const noteId = getParam(req.params.noteId);
    if (!isValidObjectId(noteId)) {
      return res.status(400).json({ message: "Invalid note id" });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to delete this note." });
    }

    await Note.findByIdAndDelete(noteId);

    return res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNote:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/me/courses/:courseId/notes
// ---------------------------------------------------------------------------
export async function getCourseNotes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getParam(req.params.courseId);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const notes = await Note.find({
      course: courseId,
      user: req.user.id,
    })
      .populate("lesson", "title order section type")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ notes });
  } catch (error) {
    console.error("Error in getCourseNotes:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/me/notes
// ---------------------------------------------------------------------------
export async function getAllUserNotes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notes = await Note.find({ user: req.user.id })
      .populate("course", "title thumbnail")
      .populate("lesson", "title order section type")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ notes });
  } catch (error) {
    console.error("Error in getAllUserNotes:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
