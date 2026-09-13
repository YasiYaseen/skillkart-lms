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
import { getCourseLessonCount } from "./shared";


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
      return res.status(403).json({ code: "NOT_ENROLLED", message: "Enroll in this course first to track progress" });
    }

    const {
      completed,
      progressPercentage,
      lastWatchedAt,
      watchedSeconds,
    }: {
      completed?: boolean;
      progressPercentage?: number;
      lastWatchedAt?: string;
      watchedSeconds?: number;
    } = req.body;

    const clampedProgress = Math.max(0, Math.min(100, Number(progressPercentage ?? 0)));
    const incomingWatchedSeconds = typeof watchedSeconds === "number" && watchedSeconds >= 0 ? Math.floor(watchedSeconds) : undefined;

    let wantsComplete = typeof completed === "boolean" ? completed : clampedProgress >= 100;

    // ── Guard 1: 80% video watch threshold ───────────────────────────────────
    // For video-type lessons with a declared duration, require the student to have
    // watched at least 80% of the video before marking it complete.
    if (wantsComplete && lesson.type === "video" && lesson.durationMinutes > 0) {
      const requiredSeconds = Math.floor(lesson.durationMinutes * 60 * 0.8);

      // Use the greater of the incoming value or what we already have stored
      const existingProgress = await LessonProgress.findOne(
        { user: req.user.id, lesson: lesson._id },
        { watchedSeconds: 1 }
      ).lean();

      const effectiveWatchedSeconds = Math.max(
        incomingWatchedSeconds ?? 0,
        existingProgress?.watchedSeconds ?? 0
      );

      if (effectiveWatchedSeconds < requiredSeconds) {
        return res.status(403).json({
          message: "Watch at least 80% of the video before marking it complete",
          watchThresholdSeconds: requiredSeconds,
          watchedSeconds: effectiveWatchedSeconds,
        });
      }
    }

    // ── Guard 2: Per-lesson completion cooldown (30 seconds) ─────────────────
    // Prevent batch-clicking all lessons by requiring at least 30 seconds between
    // each lesson completion across the entire course enrollment.
    if (wantsComplete) {
      const cooldownMs = 30_000; // 30 seconds
      const cutoff = new Date(Date.now() - cooldownMs);

      // Find the most recently completed lesson in this enrollment (any lesson, not just this one)
      // Exclude the current lesson so re-marking an already-completed lesson is not rate-limited.
      const eligibleCompletedIds = enrollment.completedLessonIds.filter(
        (id) => id.toString() !== lesson._id.toString()
      );

      const recentCompletion = eligibleCompletedIds.length
        ? await LessonProgress.findOne(
            {
              user: req.user.id,
              lesson: { $in: eligibleCompletedIds },
              completedAt: { $gte: cutoff },
            },
            { completedAt: 1 }
          ).lean()
        : null;

      if (recentCompletion?.completedAt) {
        const retryAfterMs = cooldownMs - (Date.now() - recentCompletion.completedAt.getTime());
        return res.status(429).json({
          message: "Take a moment before marking the next lesson complete",
          retryAfterMs: Math.max(0, Math.round(retryAfterMs)),
        });
      }
    }

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

    // Build the update payload — only increment watchedSeconds, never decrease it
    const updatePayload: Record<string, unknown> = {
      user: req.user.id,
      lesson: lesson._id,
      completed: isCompleted,
      progressPercentage: clampedProgress,
      lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
      completedAt: isCompleted ? new Date() : undefined,
    };
    if (incomingWatchedSeconds !== undefined) {
      updatePayload.watchedSeconds = incomingWatchedSeconds;
    }

    const progress = await LessonProgress.findOneAndUpdate(
      { user: req.user.id, lesson: lesson._id },
      incomingWatchedSeconds !== undefined
        ? {
            // Use $max so watchedSeconds only ever increases (prevents rewind cheats)
            $set: {
              user: req.user.id,
              lesson: lesson._id,
              completed: isCompleted,
              progressPercentage: clampedProgress,
              lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
              completedAt: isCompleted ? new Date() : undefined,
            },
            $max: { watchedSeconds: incomingWatchedSeconds },
          }
        : {
            $set: {
              user: req.user.id,
              lesson: lesson._id,
              completed: isCompleted,
              progressPercentage: clampedProgress,
              lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
              completedAt: isCompleted ? new Date() : undefined,
            },
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

    // Fallback: If totalLessonsCount is missing or <= 0, dynamically count lessons from sections
    if (!enrollment.totalLessonsCount || enrollment.totalLessonsCount <= 0) {
      enrollment.totalLessonsCount = await getCourseLessonCount(course._id);
    }

    // Auto-complete course status transitions
    const isFullyComplete =
      enrollment.totalLessonsCount > 0 &&
      enrollment.completedLessonIds.length >= enrollment.totalLessonsCount;

    // Track whether a certificate hold was applied (returned to frontend for UX)
    let certificateHeldUntil: Date | null = null;

    if (isFullyComplete && enrollment.status !== "completed") {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
      await enrollment.save();

      // Auto-issue certificate on completion (or re-issue if previously revoked)
      let certDoc = await Certificate.findOne({ student: req.user.id, course: course._id });
      if (certDoc) {
        if (certDoc.revokedAt) {
          // AUDIT-110: Guard against auto-clearing revokedAt if certificate was revoked for disciplinary/administrative reasons.
          // Disciplinary revocations can only be reinstated through explicit administrative review.
          if (!certDoc.isDisciplinaryRevocation) {
            await Certificate.updateOne(
              { _id: certDoc._id },
              {
                $unset: { revokedAt: 1, revocationReason: 1, isDisciplinaryRevocation: 1, revokedBy: 1 },
                $set: {
                  issuedAt: enrollment.completedAt,
                  enrollment: enrollment._id,
                },
              }
            );
            certDoc.revokedAt = undefined;
            certDoc.revocationReason = undefined;
            certDoc.isDisciplinaryRevocation = undefined;
            certDoc.revokedBy = undefined;
            certDoc.issuedAt = enrollment.completedAt;
            certDoc.enrollment = enrollment._id;
          }
        }
      } else {
        // ── Guard 3: Enrollment-to-certificate time lock ───────────────────
        // Compute the course's declared total duration. If the student completed
        // the course in less than 30% of its declared duration, hold the certificate
        // until that minimum time has elapsed. The cert is created immediately but
        // won't be publicly verifiable until heldUntil passes.
        const enrollmentAgeMs = enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime();

        // Sum durationMinutes across all lessons in the course
        const allSections = await Section.find({ course: course._id }).select("_id").lean();
        const sectionIds = allSections.map((s) => s._id);
        const allLessons = sectionIds.length
          ? await Lesson.find({ section: { $in: sectionIds } }).select("durationMinutes").lean()
          : [];
        const totalCourseDurationMs =
          allLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) * 60 * 1000;

        // Minimum required: 30% of declared duration, but only if course has declared duration
        const minimumRequiredMs =
          totalCourseDurationMs > 0 ? Math.floor(totalCourseDurationMs * 0.3) : 0;

        let heldUntilDate: Date | undefined;
        if (minimumRequiredMs > 0 && enrollmentAgeMs < minimumRequiredMs) {
          heldUntilDate = new Date(enrollment.enrolledAt.getTime() + minimumRequiredMs);
          certificateHeldUntil = heldUntilDate;
        }

        certDoc = await Certificate.create({
          student: req.user.id,
          course: course._id,
          enrollment: enrollment._id,
          issuedAt: enrollment.completedAt,
          totalLessonsAtIssuance: enrollment.totalLessonsCount,
          ...(heldUntilDate ? { heldUntil: heldUntilDate } : {}),
        });
      }

      // Notify student of course completion only if certificate is active (not administratively revoked)
      if (!certDoc.revokedAt) {
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
      }
    } else if (!isFullyComplete && enrollment.status === "completed") {
      // AUDIT-41: Preserve completed status and completedAt milestone if a valid certificate was already issued
      const hasCertificate = await Certificate.exists({
        student: req.user.id,
        course: course._id,
        $or: [{ revokedAt: { $exists: false } }, { revokedAt: null }],
      });
      if (!hasCertificate) {
        enrollment.status = "active";
        // Never silently wipe completedAt without recording historical completion milestones
      }
      await enrollment.save();
    } else {
      await enrollment.save();
    }

    const snapshot = await getCourseProgressSnapshot(req.user.id, course._id.toString());
    return res.json({
      message: "Progress updated",
      progress,
      courseProgress: snapshot,
      ...(certificateHeldUntil ? { certificateHeldUntil } : {}),
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
      return res.status(403).json({ code: "NOT_ENROLLED", message: "Enroll in this course first to view progress" });
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

    if ((!enrollment.totalLessonsCount || enrollment.totalLessonsCount <= 0) && totalLessons > 0) {
      enrollment.totalLessonsCount = totalLessons;
      await enrollment.save().catch(() => {});
    }

    const hasCertificate = await Certificate.exists({
      student: req.user.id,
      course: courseId,
      $or: [{ revokedAt: { $exists: false } }, { revokedAt: null }],
    });
    const hasNewLessons = enrollment.status === "completed" && completedCount < totalLessons;

    return res.json({
      completedLessonIds,
      totalLessons,
      completedCount,
      progressPercentage,
      isCompleted: enrollment.status === "completed",
      hasNewLessons,
      hasCertificate: Boolean(hasCertificate),
      lastLessonId: enrollment.lastAccessedLessonId,
    });
  } catch (error) {
    console.error("Error in getMyCourseProgress:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
