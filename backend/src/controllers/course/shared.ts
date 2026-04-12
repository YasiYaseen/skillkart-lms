import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";

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

export async function getCourseOrNull(courseId: string) {
  return Course.findById(courseId);
}
