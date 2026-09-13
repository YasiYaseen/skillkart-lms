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
import Wishlist from "../../models/Wishlist";
import { sendEnrollmentEmail } from "../../services/emailService";
import { recordUserActivity } from "../../services/streakService";
import {
  enrollSchema,
  enrollmentListQuerySchema,
  progressUpdateSchema,
  studentsListQuerySchema,
} from "../../validators/enrollmentValidator";
import { isCourseApprovalRequired, isCoursePubliclyAccessible, getCourseLessonCount } from "../course/shared";

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
    const requireApproval = await isCourseApprovalRequired();
    if (!isCoursePubliclyAccessible(course, requireApproval)) {
      return res.status(400).json({ message: "Course is not open for enrollment" });
    }
    if (course.instructor.toString() === req.user.id) {
      return res.status(403).json({ message: "Instructors cannot enroll in their own course" });
    }

    const existing = await Enrollment.findOne({ student: req.user.id, course: courseId });
    if (existing && (existing.status === "active" || existing.status === "completed")) {
      return res.status(200).json({ message: "Already enrolled", enrollment: existing });
    }

    // Direct enrollment is only allowed for free courses. Paid courses must be purchased via checkout.
    if (course.isPaid || (course.price !== null && course.price !== undefined && course.price > 0)) {
      return res.status(402).json({
        message: "This is a paid course. Please complete checkout to enroll.",
      });
    }

    if (existing && existing.status === "cancelled") {
      existing.status = "active";
      existing.completedLessonIds = [];
      existing.enrolledAt = new Date();
      existing.lastAccessedLessonId = undefined;
      // Recount
      const totalLessons = await getCourseLessonCount(courseId);
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
            link: `/instructor/students?courseId=${course._id}`,
          }
        ]);

        return res.status(200).json({ message: "Enrollment reactivated", enrollment: existing });
      }

    // New enrollment
    const totalLessonsCount = await getCourseLessonCount(courseId);

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
        link: `/instructor/students?courseId=${course._id}`,
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

    // Clear enrolled course from user's wishlist
    Wishlist.findOneAndDelete({
      student: req.user.id,
      course: course._id,
    }).catch(() => {});

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
      .populate("lastAccessedLessonId", "title")
      .sort({ createdAt: -1 });

    const filteredData = data.filter((doc) => doc.course != null);

    // add virtuals to plain JSON representation, self-healing totalLessonsCount if missing or 0
    const result = await Promise.all(
      filteredData.map(async (doc) => {
        if ((!doc.totalLessonsCount || doc.totalLessonsCount <= 0) && doc.course) {
          const courseId = (doc.course as { _id?: Types.ObjectId })._id || doc.course;
          const totalLessons = await getCourseLessonCount(courseId.toString());
          if (totalLessons > 0) {
            doc.totalLessonsCount = totalLessons;
            await Enrollment.updateOne(
              { _id: doc._id },
              { $set: { totalLessonsCount: totalLessons } }
            ).catch(() => {});
          }
        }
        return doc.toJSON({ virtuals: true });
      })
    );

    return res.json({ data: result, page, limit, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourseEnrollment(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid course id" });

    const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
    if (!enrollment) return res.status(404).json({ code: "NOT_ENROLLED", message: "Enrollment not found" });

    if ((!enrollment.totalLessonsCount || enrollment.totalLessonsCount <= 0) && enrollment.course) {
      const totalLessons = await getCourseLessonCount(enrollment.course);
      if (totalLessons > 0) {
        enrollment.totalLessonsCount = totalLessons;
        await enrollment.save().catch(() => {});
      }
    }

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
    if (!enrollment) return res.status(404).json({ code: "NOT_ENROLLED", message: "Enrollment not found" });

    if (enrollment.status !== "active") return res.status(403).json({ code: "NOT_ENROLLED", message: "Enrollment is not active" });

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

    // Fallback: If totalLessonsCount is missing or <= 0, dynamically count lessons from sections
    if (!updated.totalLessonsCount || updated.totalLessonsCount <= 0) {
      const totalLessons = await getCourseLessonCount(enrollment.course);
      updated.totalLessonsCount = totalLessons;
      await updated.save();
    }

    // Guard against impossible state (should never happen due to $addToSet, but safety net)
    if (updated.totalLessonsCount > 0 && updated.completedLessonIds.length > updated.totalLessonsCount) {
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

      // Auto-issue certificate on completion (or re-issue if previously revoked)
      let certDoc = await Certificate.findOne({ student: req.user.id, course: enrollment.course });
      if (certDoc) {
        if (certDoc.revokedAt) {
          // AUDIT-110: Guard against auto-clearing revokedAt if certificate was revoked for disciplinary/administrative reasons.
          if (!certDoc.isDisciplinaryRevocation) {
            await Certificate.updateOne(
              { _id: certDoc._id },
              {
                $unset: { revokedAt: 1, revocationReason: 1, isDisciplinaryRevocation: 1, revokedBy: 1 },
                $set: {
                  issuedAt: updated.completedAt,
                  enrollment: updated._id,
                },
              }
            );
            certDoc.revokedAt = undefined;
            certDoc.revocationReason = undefined;
            certDoc.isDisciplinaryRevocation = undefined;
            certDoc.revokedBy = undefined;
            certDoc.issuedAt = updated.completedAt;
            certDoc.enrollment = updated._id;
          }
        }
      } else {
        certDoc = await Certificate.create({
          student: req.user.id,
          course: enrollment.course,
          enrollment: updated._id,
          issuedAt: updated.completedAt,
        });
      }

      // Notify student of course completion only if certificate is active (not administratively revoked)
      if (!certDoc.revokedAt) {
        const courseObj = await Course.findById(enrollment.course).select("title");
        await Notification.create({
          recipient: req.user.id,
          title: "Course Completed! 🎉",
          message: `Congratulations on completing "${courseObj?.title || "your course"}"! Your certificate is ready.`,
          type: "success",
          link: `/my-certificates`,
        });
      }
    } else if (!isFullyComplete && updated.status === "completed") {
      // User un-marked a lesson after course was auto-completed — revert to active only if no unrevoked certificate exists
      const hasCertificate = await Certificate.exists({
        student: req.user.id,
        course: enrollment.course,
        $or: [{ revokedAt: { $exists: false } }, { revokedAt: null }],
      });
      if (!hasCertificate) {
        updated.status = "active";
        updated.completedAt = undefined;
      }
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

    // AUDIT-64: Cascade cancellation — clean up progress, revoke certificate, notify student
    try {
      // Remove lesson progress for this student in this course
      const sections = await Section.find({ course: enrollment.course }).select("_id").lean();
      const sectionIds = sections.map((s) => s._id);
      if (sectionIds.length > 0) {
        const lessons = await Lesson.find({ section: { $in: sectionIds } }).select("_id").lean();
        const lessonIds = lessons.map((l) => l._id);
        if (lessonIds.length > 0) {
          await LessonProgress.deleteMany({ user: enrollment.student, lesson: { $in: lessonIds } });
        }
      }
      // Revoke certificate if one was issued (due to enrollment cancellation)
      await Certificate.findOneAndUpdate(
        { student: enrollment.student, course: enrollment.course },
        {
          $set: {
            revokedAt: new Date(),
            revocationReason: "Enrollment cancelled",
            isDisciplinaryRevocation: false,
          },
        }
      );
      // Notify student
      await Notification.create({
        recipient: enrollment.student,
        title: "Enrollment Cancelled",
        message: "Your enrollment in this course has been cancelled.",
        type: "warning",
        link: "/my-courses",
      });
    } catch (cascadeError) {
      console.error("cancelEnrollment cascade error:", cascadeError);
    }

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

    const requireApproval = await isCourseApprovalRequired();
    if (!isCoursePubliclyAccessible(course, requireApproval)) {
      const isManager = req.user && (req.user.role === "admin" || req.user.id === course.instructor.toString());
      if (!isManager) {
        const isEnrolled = req.user
          ? !!(await Enrollment.exists({
              student: req.user.id,
              course: course._id,
              status: { $in: ["active", "completed"] },
            }))
          : false;
        if (!isEnrolled) {
          return res.status(403).json({ message: "Course is not publicly accessible" });
        }
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
