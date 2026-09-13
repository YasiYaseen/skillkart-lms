import { type Types } from "mongoose";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import Enrollment from "../../models/Enrollment";
import Certificate from "../../models/Certificate";
import SystemSettings from "../../models/SystemSettings";

export function isCourseManager(userId: string, role: string, instructorId: string): boolean {
  return role === "admin" || userId === instructorId;
}

export async function isCourseApprovalRequired(): Promise<boolean> {
  const settings = await SystemSettings.findOne({ isSingleton: true }).select("requireCourseApproval").lean();
  return settings?.requireCourseApproval ?? true;
}

export async function getCourseApprovalFilter(): Promise<Record<string, unknown>> {
  const required = await isCourseApprovalRequired();
  return required ? { isApproved: true } : { isApproved: { $ne: false } };
}

export function isCoursePubliclyAccessible(
  course: { status?: string; isActive?: boolean; isApproved?: boolean },
  requireCourseApproval: boolean
): boolean {
  if (course.status !== "published" || course.isActive === false || course.isApproved === false) {
    return false;
  }
  if (requireCourseApproval && course.isApproved !== true) {
    return false;
  }
  return true;
}

export async function getCourseDurationMinutes(courseId: string): Promise<number> {
  const sections = await Section.find({ course: courseId }).select("_id").lean();
  const sectionIds = sections.map((section) => section._id);
  if (sectionIds.length === 0) {
    return 0;
  }

  const lessons = await Lesson.find({ section: { $in: sectionIds } }).select("durationMinutes").lean();
  return lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0);
}

/**
 * Computes the total number of lessons for a course across all sections.
 */
export async function getCourseLessonCount(courseId: string | Types.ObjectId): Promise<number> {
  const sections = await Section.find({ course: courseId }).select("_id").lean();
  const sectionIds = sections.map((s) => s._id);
  if (sectionIds.length === 0) {
    return 0;
  }

  return Lesson.countDocuments({ section: { $in: sectionIds } });
}

/**
 * Syncs totalLessonsCount on all enrollments for a course.
 * Call this after any lesson is created or deleted for the course.
 * Protects completed enrollments so curriculum expansions never demote graduates,
 * and auto-completes active enrollments that reach 100% on lesson deletions.
 */
export async function syncEnrollmentLessonCount(courseId: string): Promise<void> {
  const totalLessons = await getCourseLessonCount(courseId);
  await Enrollment.updateMany({ course: courseId }, { $set: { totalLessonsCount: totalLessons } });

  if (totalLessons > 0) {
    // Auto-complete active enrollments that now have all lessons completed due to lesson removal
    const eligibleEnrollments = await Enrollment.find({
      course: courseId,
      status: "active",
      $expr: { $gte: [{ $size: { $ifNull: ["$completedLessonIds", []] } }, totalLessons] },
    });

    for (const enrollment of eligibleEnrollments) {
      enrollment.status = "completed";
      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }
      await enrollment.save();

      const certExists = await Certificate.exists({
        student: enrollment.student,
        course: enrollment.course,
        $or: [{ revokedAt: { $exists: false } }, { revokedAt: null }],
      });
      if (!certExists) {
        await Certificate.create({
          student: enrollment.student,
          course: enrollment.course,
          enrollment: enrollment._id,
          issuedAt: enrollment.completedAt,
          totalLessonsAtIssuance: totalLessons,
        }).catch((err) => console.error("Auto-issue certificate error in syncEnrollmentLessonCount:", err));
      }
    }
  }
}

