import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";
import Lesson from "../../models/Lesson";
import Section, { type ISection } from "../../models/Section";
import LessonProgress from "../../models/LessonProgress";
import Certificate from "../../models/Certificate";
import Notification from "../../models/Notification";
import User from "../../models/User";
import { sendEnrollmentEmail } from "../../services/emailService";
import { recordUserActivity } from "../../services/streakService";
import {
  enrollSchema,
  enrollmentListQuerySchema,
  progressUpdateSchema,
  studentsListQuerySchema,
} from "../../validators/enrollmentValidator";

export async function enrollInCourse(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const { courseId } = parsed.data;

    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status === "archived") {
      return res.status(400).json({ message: "Cannot enroll in an archived course" });
    }
    if (course.status !== "published") {
      return res.status(400).json({ message: "Course is not open for enrollment" });
    }
    if (course.instructor.toString() === req.user.id) {
      return res.status(403).json({ message: "Instructors cannot enroll in their own course" });
    }

    const existing = await Enrollment.findOne({ student: req.user.id, course: courseId });
    if (existing) {
      if (existing.status === "active" || existing.status === "completed") {
        return res.status(200).json({ message: "Already enrolled", enrollment: existing });
      }
      if (existing.status === "cancelled") {
        existing.status = "active";
        existing.completedLessonIds = [];
        existing.enrolledAt = new Date();
        existing.lastAccessedLessonId = undefined;
        // Recount
        const sections = await Section.find({ course: courseId }).select("_id").lean();
        const sectionIds = sections.map((s) => s._id);
        const totalLessons = sectionIds.length ? await Lesson.countDocuments({ section: { $in: sectionIds } }) : 0;
        existing.totalLessonsCount = totalLessons;

        await existing.save();

        // Notify student and instructor on reactivation
        await Notification.create([
          {
            recipient: req.user.id,
            title: "Enrollment Reactivated",
            message: `You have successfully reactivated your enrollment for "${course.title}".`,
            type: "success",
            link: `/my-courses`,
          },
          {
            recipient: course.instructor,
            title: "Student Reactivated Enrollment",
            message: `A student has reactivated their enrollment in your course "${course.title}".`,
            type: "info",
            link: `/instructor/courses/${course._id}/students`,
          }
        ]);

        return res.status(200).json({ message: "Enrollment reactivated", enrollment: existing });
      }
    }

    // New enrollment
    const sections = await Section.find({ course: courseId }).select("_id").lean();
    const sectionIds = sections.map((s) => s._id);
    const totalLessonsCount = sectionIds.length ? await Lesson.countDocuments({ section: { $in: sectionIds } }) : 0;

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
      status: "active",
      paymentStatus: "none",
      totalLessonsCount,
      completedLessonIds: [],
      enrolledAt: new Date(),
    });

    // Notify student and instructor on new enrollment
    await Notification.create([
      {
        recipient: req.user.id,
        title: "Course Enrolled",
        message: `You have successfully enrolled in "${course.title}". Happy learning!`,
        type: "success",
        link: `/my-courses`,
      },
      {
        recipient: course.instructor,
        title: "New Student Enrolled",
        message: `A new student has enrolled in your course "${course.title}".`,
        type: "info",
        link: `/instructor/courses/${course._id}/students`,
      }
    ]);

    // Send failsafe enrollment confirmation email
    User.findById(req.user.id)
      .select("email name")
      .lean()
      .then((studentUser) => {
        if (studentUser && studentUser.email) {
          sendEnrollmentEmail(
            studentUser.email,
            studentUser.name || "Student",
            course.title,
            course._id.toString()
          ).catch((err) => console.error("Enrollment email failed:", err));
        }
      })
      .catch((err) => console.error("User lookup for enrollment email failed:", err));

    recordUserActivity(req.user.id).catch((err) =>
      console.error("Streak recording on enrollment failed:", err)
    );

    return res.status(201).json({ message: "Enrolled successfully", enrollment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getMyEnrollments(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = enrollmentListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query params" });
    }
    const { status, page, limit } = parsed.data;

    const filter: Record<string, unknown> = { student: req.user.id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const total = await Enrollment.countDocuments(filter);
    const data = await Enrollment.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("course", "title thumbnailUrl instructor")
      .sort({ createdAt: -1 });

    const filteredData = data.filter((doc) => doc.course != null);

    // add virtuals to plain JSON representation
    const result = filteredData.map(doc => {
      const obj = doc.toJSON({ virtuals: true });
      return obj;
    });

    return res.json({ data: result, page, limit, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourseEnrollment(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid course id" });

    const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    return res.json(enrollment.toJSON({ virtuals: true }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourseStudents(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const parsed = studentsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query params" });
    }
    const { page, limit } = parsed.data;

    const filter = { course: courseId, status: { $in: ["active", "completed"] } };
    const skip = (page - 1) * limit;
    const total = await Enrollment.countDocuments(filter);

    const data = await Enrollment.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    const result = data.map(doc => doc.toJSON({ virtuals: true }));

    return res.json({ data: result, page, limit, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateProgress(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid enrollment id" });

    const parsed = progressUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Validation failed" });
    const { lessonId, completed } = parsed.data;

    if (!isValidObjectId(lessonId)) return res.status(400).json({ message: "Invalid lesson id" });

    const enrollment = await Enrollment.findOne({ _id: id, student: req.user.id });
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    if (enrollment.status !== "active") return res.status(403).json({ message: "Enrollment is not active" });

    const lesson = await Lesson.findById(lessonId).populate<{ section: ISection }>({
      path: "section",
      select: "course",
    });
    if (!lesson || !lesson.section || !lesson.section.course) {
      return res.status(400).json({ message: "Lesson not found or malformed" });
    }

    if (lesson.section.course.toString() !== enrollment.course.toString()) {
      return res.status(400).json({ message: "Lesson does not belong to this course" });
    }

    let updated;
    if (completed) {
      updated = await Enrollment.findOneAndUpdate(
        { _id: id },
        { 
          $addToSet: { completedLessonIds: lessonId },
          $set: { lastAccessedLessonId: lessonId }
        },
        { new: true }
      );
    } else {
      updated = await Enrollment.findOneAndUpdate(
        { _id: id },
        { 
          $pull: { completedLessonIds: lessonId },
          $set: { lastAccessedLessonId: lessonId }
        },
        { new: true }
      );
    }

    if (!updated) return res.status(500).json({ message: "Update failed" });

    // Keep LessonProgress collection in sync
    await LessonProgress.findOneAndUpdate(
      { user: req.user.id, lesson: lessonId },
      {
        user: req.user.id,
        lesson: lessonId,
        completed: completed,
        progressPercentage: completed ? 100 : 0,
        lastWatchedAt: new Date(),
        completedAt: completed ? new Date() : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Guard against impossible state (should never happen due to $addToSet, but safety net)
    if (updated.completedLessonIds.length > updated.totalLessonsCount) {
      return res.status(400).json({ message: "Invalid state: completed lessons exceed total lessons" });
    }

    // Auto-complete: if all mandatory lessons are done, mark course completed
    const isFullyComplete =
      updated.totalLessonsCount > 0 &&
      updated.completedLessonIds.length >= updated.totalLessonsCount;

    if (isFullyComplete && updated.status !== "completed") {
      updated.status = "completed";
      updated.completedAt = new Date();
      await updated.save();

      // Auto-issue certificate on first completion
      await Certificate.findOneAndUpdate(
        { student: req.user.id, course: enrollment.course },
        {
          $setOnInsert: {
            student: req.user.id,
            course: enrollment.course,
            enrollment: updated._id,
            issuedAt: updated.completedAt,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Notify student of course completion
      const courseObj = await Course.findById(enrollment.course).select("title");
      await Notification.create({
        recipient: req.user.id,
        title: "Course Completed! 🎉",
        message: `Congratulations on completing "${courseObj?.title || "your course"}"! Your certificate is ready.`,
        type: "success",
        link: `/my-certificates`,
      });
    } else if (!isFullyComplete && updated.status === "completed") {
      // User un-marked a lesson after course was auto-completed — revert to active
      updated.status = "active";
      updated.completedAt = undefined;
      await updated.save();
    }

    return res.json(updated.toJSON({ virtuals: true }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function cancelEnrollment(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid enrollment id" });

    const enrollment = await Enrollment.findOne({ _id: id, student: req.user.id });
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    if (enrollment.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    enrollment.status = "cancelled";
    await enrollment.save();

    return res.status(200).json({ message: "Enrollment cancelled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCurriculumForCourse(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published" || course.isActive === false || course.isApproved === false) {
      const isManager = req.user && (req.user.role === "admin" || req.user.id === course.instructor.toString());
      if (!isManager) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const sections = await Section.find({ course: course._id }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((s) => s._id);
    const lessons = sectionIds.length
      ? await Lesson.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
      : [];

    return res.json({ sections, lessons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
