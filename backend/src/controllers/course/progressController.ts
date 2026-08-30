import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import Enrollment from "../../models/Enrollment";
import LessonProgress from "../../models/LessonProgress";
import Quiz from "../../models/Quiz";
import QuizAttempt from "../../models/QuizAttempt";
import Certificate from "../../models/Certificate";
import Notification from "../../models/Notification";
import User from "../../models/User";
import { sendCertificateEmail } from "../../services/emailService";
import { recordUserActivity } from "../../services/streakService";


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
  const allLessons = sectionIds.length
    ? await Lesson.find({ section: { $in: sectionIds } }).select("_id isMandatory")
    : [];
  const allLessonIds = allLessons.map((lesson) => lesson._id);
  const mandatoryLessonIds = allLessons.filter((l) => l.isMandatory).map((l) => l._id);

  const completedProgress = allLessonIds.length
    ? await LessonProgress.find({
        user: userId,
        lesson: { $in: allLessonIds },
        completed: true,
      }).select("lesson")
    : [];

  const completedLessonIdSet = new Set(completedProgress.map((p) => p.lesson.toString()));

  const totalLessons = allLessonIds.length;
  const completedLessons = completedProgress.length;
  const totalMandatoryLessons = mandatoryLessonIds.length;
  const completedMandatoryLessons = mandatoryLessonIds.filter((id) =>
    completedLessonIdSet.has(id.toString())
  ).length;

  const completionPercentage =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    totalMandatoryLessons,
    completedMandatoryLessons,
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

    // Sync with Enrollment model
    enrollment.lastAccessedLessonId = new Types.ObjectId(lesson._id.toString());
    if (isCompleted) {
      if (!enrollment.completedLessonIds.some((id) => id.toString() === lesson._id.toString())) {
        enrollment.completedLessonIds.push(new Types.ObjectId(lesson._id.toString()));
      }
    } else {
      enrollment.completedLessonIds = enrollment.completedLessonIds.filter(
        (id) => id.toString() !== lesson._id.toString()
      );
    }

    // Record student learning streak
    recordUserActivity(req.user.id).catch((err) =>
      console.error("Failed to update learning streak:", err)
    );

    // Auto-complete course status transitions
    const isFullyComplete =
      enrollment.totalLessonsCount > 0 &&
      enrollment.completedLessonIds.length >= enrollment.totalLessonsCount;

    if (isFullyComplete && enrollment.status !== "completed") {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
      await enrollment.save();

      // Auto-issue certificate on first completion
      const certDoc = await Certificate.findOneAndUpdate(
        { student: req.user.id, course: course._id },
        {
          $setOnInsert: {
            student: req.user.id,
            course: course._id,
            enrollment: enrollment._id,
            issuedAt: enrollment.completedAt,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Notify student of course completion
      await Notification.create({
        recipient: req.user.id,
        title: "Course Completed! 🎉",
        message: `Congratulations on completing "${course.title}"! Your certificate is ready.`,
        type: "success",
        link: `/my-certificates`,
      });

      // Failsafe certificate completion email
      User.findById(req.user.id)
        .select("email name")
        .lean()
        .then((studentUser) => {
          if (studentUser && studentUser.email && certDoc) {
            sendCertificateEmail(
              studentUser.email,
              studentUser.name || "Student",
              course.title,
              certDoc.certificateId
            ).catch((err) => {
              console.error("[EMAIL] Failed to send course completion email:", err);
            });
          }
        })
        .catch((err) => {
          console.error("[EMAIL] Error fetching user for certificate email:", err);
        });
    } else if (!isFullyComplete && enrollment.status === "completed") {
      enrollment.status = "active";
      enrollment.completedAt = undefined;
      await enrollment.save();
    } else {
      await enrollment.save();
    }

    const snapshot = await getCourseProgressSnapshot(req.user.id, course._id.toString());
    return res.json({
      message: "Progress updated",
      progress,
      courseProgress: snapshot,
    });
  } catch (error) {
    console.error("Error in updateLessonProgress:", error);
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
      lastLessonId: enrollment.lastAccessedLessonId,
    });
  } catch (error) {
    console.error("Error in getMyCourseProgress:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
