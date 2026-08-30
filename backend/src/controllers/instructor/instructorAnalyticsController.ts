import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import Enrollment from "../../models/Enrollment";
import QuizAttempt from "../../models/QuizAttempt";

function getParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

export async function getInstructorAnalytics(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const instructorId = req.user.id;
    const requestedCourseId = getParam(req.query.courseId as string);

    // 1. Fetch instructor's courses (or verify the requested course)
    const courseQuery: Record<string, unknown> = { isActive: true };
    if (req.user.role !== "admin") {
      courseQuery.instructor = new Types.ObjectId(instructorId);
    }

    if (requestedCourseId) {
      if (!isValidObjectId(requestedCourseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      courseQuery._id = new Types.ObjectId(requestedCourseId);
    }

    const courses = await Course.find(courseQuery).select("_id title status price thumbnailUrl level").lean();
    if (requestedCourseId && courses.length === 0) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.json({
        summary: {
          totalCourses: 0,
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          completionRate: 0,
          totalEarnings: 0,
          averageQuizScore: 0,
          totalQuizAttempts: 0,
          quizPassRate: 0,
        },
        courses: [],
        coursePerformance: [],
        mostActiveStudents: [],
        lessonDropOff: [],
        quizPerformance: [],
      });
    }

    // 2. Fetch all enrollments for these courses
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
    })
      .populate("student", "name email avatar")
      .populate("lastAccessedLessonId", "title")
      .lean();

    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
    const completionRate =
      totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Calculate total earnings
    const coursePriceMap = new Map(courses.map((c) => [c._id.toString(), c.price || 0]));
    const totalEarnings = enrollments.reduce((acc, curr) => {
      const price = coursePriceMap.get(curr.course.toString()) || 0;
      return acc + price;
    }, 0);

    // 3. Quiz Performance & Attempts
    // Find all sections and lessons for these courses
    const sections = await Section.find({ course: { $in: courseIds } })
      .sort({ order: 1 })
      .lean();
    const sectionIds = sections.map((s) => s._id);

    const lessons = await Lesson.find({ section: { $in: sectionIds } })
      .sort({ order: 1 })
      .lean();
    const lessonIds = lessons.map((l) => l._id);
    const quizLessonIds = lessons.filter((l) => l.type === "quiz").map((l) => l._id);

    const quizAttempts = await QuizAttempt.find({
      lesson: { $in: quizLessonIds },
    }).lean();

    const totalQuizAttempts = quizAttempts.length;
    const totalQuizScoreSum = quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageQuizScore =
      totalQuizAttempts > 0 ? Math.round((totalQuizScoreSum / totalQuizAttempts) * 10) / 10 : 0;
    const passedAttempts = quizAttempts.filter((a) => a.passed).length;
    const quizPassRate =
      totalQuizAttempts > 0 ? Math.round((passedAttempts / totalQuizAttempts) * 100) : 0;

    // Breakdown per quiz lesson
    const quizPerformance = quizLessonIds.map((quizLessonId) => {
      const lessonDoc = lessons.find((l) => l._id.toString() === quizLessonId.toString());
      const attempts = quizAttempts.filter((a) => a.lesson.toString() === quizLessonId.toString());
      const attemptsCount = attempts.length;
      const avgScore =
        attemptsCount > 0
          ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / attemptsCount) * 10) / 10
          : 0;
      const passCount = attempts.filter((a) => a.passed).length;
      const passRate = attemptsCount > 0 ? Math.round((passCount / attemptsCount) * 100) : 0;

      return {
        lessonId: quizLessonId,
        title: lessonDoc?.title || "Quiz",
        attemptsCount,
        averageScore: avgScore,
        passRate,
      };
    });

    // 4. Most Active Students
    interface StudentStats {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      totalCompletedLessons: number;
      totalEnrolledCourses: number;
      completedCoursesCount: number;
      averageProgressPercentage: number;
      progressSums: number;
      lastActivity: Date | string;
    }

    interface PopulatedStudent {
      _id: Types.ObjectId;
      name?: string;
      email: string;
      avatar?: string;
    }

    const studentStatsMap = new Map<string, StudentStats>();
    enrollments.forEach((e) => {
      const student = e.student as unknown as PopulatedStudent | null;
      if (!student) return;
      const sId = student._id.toString();
      if (!studentStatsMap.has(sId)) {
        studentStatsMap.set(sId, {
          id: sId,
          name: student.name || "Student",
          email: student.email,
          avatar: student.avatar,
          totalCompletedLessons: 0,
          totalEnrolledCourses: 0,
          completedCoursesCount: 0,
          averageProgressPercentage: 0,
          progressSums: 0,
          lastActivity: e.updatedAt || e.enrolledAt,
        });
      }

      const stat = studentStatsMap.get(sId)!;
      stat.totalEnrolledCourses += 1;
      stat.totalCompletedLessons += (e.completedLessonIds || []).length;
      if (e.status === "completed") {
        stat.completedCoursesCount += 1;
      }
      const progress =
        e.totalLessonsCount > 0
          ? Math.round(((e.completedLessonIds || []).length / e.totalLessonsCount) * 100)
          : 0;
      stat.progressSums += progress;
      if (new Date(e.updatedAt).getTime() > new Date(stat.lastActivity).getTime()) {
        stat.lastActivity = e.updatedAt;
      }
    });

    const mostActiveStudents = Array.from(studentStatsMap.values())
      .map((s) => ({
        ...s,
        averageProgressPercentage:
          s.totalEnrolledCourses > 0 ? Math.round(s.progressSums / s.totalEnrolledCourses) : 0,
      }))
      .sort((a, b) => b.totalCompletedLessons - a.totalCompletedLessons || b.averageProgressPercentage - a.averageProgressPercentage)
      .slice(0, 10);

    // 5. Lesson Drop-off Tracking
    // Build ordered list of lessons with completion and drop-off counts
    const lessonCompletionCounts = new Map<string, number>();
    const lessonLastAccessedCounts = new Map<string, number>();

    enrollments.forEach((e) => {
      (e.completedLessonIds || []).forEach((lId) => {
        const strId = lId.toString();
        lessonCompletionCounts.set(strId, (lessonCompletionCounts.get(strId) || 0) + 1);
      });
      if (e.lastAccessedLessonId) {
        const lastAccess = e.lastAccessedLessonId as unknown as { _id?: Types.ObjectId } | Types.ObjectId | string;
        const lastId = typeof lastAccess === "object" && lastAccess !== null && "_id" in lastAccess && lastAccess._id
          ? lastAccess._id.toString()
          : lastAccess.toString();
        lessonLastAccessedCounts.set(lastId, (lessonLastAccessedCounts.get(lastId) || 0) + 1);
      }
    });


    const lessonDropOff = lessons.map((les, index) => {
      const lesIdStr = les._id.toString();
      const completedCount = lessonCompletionCounts.get(lesIdStr) || 0;
      const lastAccessedCount = lessonLastAccessedCounts.get(lesIdStr) || 0;
      const completionRateForLesson =
        totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;
      const dropOffCount = Math.max(0, totalEnrollments - completedCount);
      const dropOffRate = totalEnrollments > 0 ? Math.round((dropOffCount / totalEnrollments) * 100) : 0;

      return {
        lessonId: les._id,
        order: index + 1,
        title: les.title,
        type: les.type,
        completedCount,
        lastAccessedCount,
        completionRate: completionRateForLesson,
        dropOffCount,
        dropOffRate,
      };
    });

    // 6. Course-by-course Performance Summary
    const coursePerformance = courses.map((course) => {
      const cIdStr = course._id.toString();
      const cEnrollments = enrollments.filter((e) => e.course.toString() === cIdStr);
      const cTotal = cEnrollments.length;
      const cCompleted = cEnrollments.filter((e) => e.status === "completed").length;
      const cActive = cEnrollments.filter((e) => e.status === "active").length;
      const cRate = cTotal > 0 ? Math.round((cCompleted / cTotal) * 100) : 0;
      const cEarnings = cTotal * (course.price || 0);

      return {
        courseId: course._id,
        title: course.title,
        status: course.status,
        price: course.price,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
        totalEnrollments: cTotal,
        activeEnrollments: cActive,
        completedEnrollments: cCompleted,
        completionRate: cRate,
        earnings: cEarnings,
      };
    });

    return res.json({
      summary: {
        totalCourses: courses.length,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate,
        totalEarnings,
        averageQuizScore,
        totalQuizAttempts,
        quizPassRate,
      },
      courses: courses.map((c) => ({ _id: c._id, title: c.title })),
      coursePerformance,
      mostActiveStudents,
      lessonDropOff,
      quizPerformance,
    });
  } catch (error) {
    console.error("Error in getInstructorAnalytics:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getInstructorStudents(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const instructorId = req.user.id;
    const courseQuery: Record<string, unknown> = { isActive: true };
    if (req.user.role !== "admin") {
      courseQuery.instructor = new Types.ObjectId(instructorId);
    }

    const courses = await Course.find(courseQuery).select("_id title").lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.json({ students: [] });
    }

    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
    })
      .populate("student", "name email avatar")
      .populate("course", "title thumbnailUrl")
      .sort({ createdAt: -1 })
      .lean();

    const students = enrollments.map((e: any) => ({
      id: e._id,
      studentId: e.student?._id,
      name: e.student?.name || "Unknown Student",
      email: e.student?.email || "",
      avatar: e.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.student?.name || "User")}&background=random`,
      courseId: e.course?._id,
      courseTitle: e.course?.title || "Unknown Course",
      enrolledAt: e.createdAt,
      status: e.status || "active",
      progressPercentage: e.progressPercentage || 0,
      completedLessonsCount: e.completedLessonIds?.length || 0,
    }));

    return res.json({ students });
  } catch (error) {
    console.error("Error in getInstructorStudents:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
