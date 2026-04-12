import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../../models/Course.js";
import Section from "../../models/Section.js";
import Lesson from "../../models/Lesson.js";
import Enrollment from "../../models/Enrollment.js";
import LessonProgress from "../../models/LessonProgress.js";
import Quiz from "../../models/Quiz.js";
import QuizAttempt from "../../models/QuizAttempt.js";

async function getCourseFromLessonId(lessonId: string) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return null;
  }

  const section = await Section.findById(lesson.section);
  if (!section) {
    return null;
  }

  const course = await Course.findById(section.course);
  if (!course) {
    return null;
  }

  return { lesson, section, course };
}

function normalizeParam(param: string | string[] | undefined): string | null {
  if (!param) {
    return null;
  }
  return Array.isArray(param) ? param[0] : param;
}

async function getCourseProgressSnapshot(userId: string, courseId: string) {
  const sections = await Section.find({ course: courseId }).select("_id");
  const sectionIds = sections.map((section) => section._id);
  const mandatoryLessons = sectionIds.length
    ? await Lesson.find({ section: { $in: sectionIds }, isMandatory: true }).select("_id")
    : [];
  const mandatoryLessonIds = mandatoryLessons.map((lesson) => lesson._id);

  const completedMandatory = mandatoryLessonIds.length
    ? await LessonProgress.countDocuments({
        user: userId,
        lesson: { $in: mandatoryLessonIds },
        completed: true,
      })
    : 0;

  const totalMandatory = mandatoryLessonIds.length;
  const completionPercentage =
    totalMandatory === 0 ? 0 : Math.round((completedMandatory / totalMandatory) * 100);

  return {
    totalMandatoryLessons: totalMandatory,
    completedMandatoryLessons: completedMandatory,
    completionPercentage,
  };
}

export async function updateLessonProgress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = normalizeParam(req.params.lessonId);
    if (!lessonId) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const resolved = await getCourseFromLessonId(lessonId);
    if (!resolved) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const { lesson, course } = resolved;

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: course._id,
      status: { $in: ["active", "completed"] },
    });
    if (!enrollment) {
      return res.status(403).json({ message: "Enroll in this course first" });
    }

    enrollment.last_lesson_id = lesson._id as any;
    await enrollment.save();

    const {
      completed,
      progressPercentage,
      lastWatchedAt,
    }: {
      completed?: boolean;
      progressPercentage?: number;
      lastWatchedAt?: string;
    } = req.body;

    const clampedProgress = Math.max(0, Math.min(100, Number(progressPercentage ?? 0)));
    let wantsComplete = typeof completed === "boolean" ? completed : clampedProgress >= 100;

    if (wantsComplete) {
      const quiz = await Quiz.findOne({ lesson: lesson._id }).lean();
      if (quiz) {
        const latestAttempt = await QuizAttempt.findOne(
          { user: req.user.id, lesson: lesson._id },
          { passed: 1 },
          { sort: { createdAt: -1 } }
        ).lean();
        if (!latestAttempt?.passed) {
          return res.status(403).json({
            message: "You must pass the quiz before marking this lesson complete",
          });
        }
      }
    }

    const isCompleted = wantsComplete;

    const progress = await LessonProgress.findOneAndUpdate(
      { user: req.user.id, lesson: lesson._id },
      {
        user: req.user.id,
        lesson: lesson._id,
        completed: isCompleted,
        progressPercentage: clampedProgress,
        lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
        completedAt: isCompleted ? new Date() : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const snapshot = await getCourseProgressSnapshot(req.user.id, course._id.toString());
    return res.json({
      message: "Progress updated",
      progress,
      courseProgress: snapshot,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getMyCourseProgress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = normalizeParam(req.params.courseId);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });
    if (!enrollment) {
      return res.status(403).json({ message: "Enroll in this course first" });
    }

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((section) => section._id);
    const lessons = sectionIds.length
      ? await Lesson.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
      : [];
    const lessonIds = lessons.map((lesson) => lesson._id);
    const progressDocs = lessonIds.length
      ? await LessonProgress.find({ user: req.user.id, lesson: { $in: lessonIds } }).lean()
      : [];

    const completedLessonIds = progressDocs.filter((p) => p.completed).map((p) => p.lesson.toString());
    const totalLessons = lessons.length;
    const completedCount = completedLessonIds.length;
    const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

    return res.json({
      completedLessonIds,
      totalLessons,
      completedCount,
      progressPercentage,
      lastLessonId: enrollment.last_lesson_id,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
