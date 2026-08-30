import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import Enrollment from "../../models/Enrollment";

export function isCourseManager(userId: string, role: string, instructorId: string): boolean {
  return role === "admin" || userId === instructorId;
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
 * Syncs totalLessonsCount on all enrollments for a course.
 * Call this after any lesson is created or deleted for the course.
 */
export async function syncEnrollmentLessonCount(courseId: string): Promise<void> {
  const sections = await Section.find({ course: courseId }).select("_id").lean();
  const sectionIds = sections.map((s) => s._id);
  const totalLessons = sectionIds.length
    ? await Lesson.countDocuments({ section: { $in: sectionIds } })
    : 0;

  await Enrollment.updateMany({ course: courseId }, { $set: { totalLessonsCount: totalLessons } });
}
