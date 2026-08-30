import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Announcement from "../../models/Announcement";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";
import Notification from "../../models/Notification";
import { announcementSchema } from "../../validators/announcement.validator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCourseIdParam(req: Request): string {
  const { courseId } = req.params;
  return Array.isArray(courseId) ? courseId[0] : courseId;
}

/** Returns the course if it exists AND the requesting user is the instructor (or admin). */
async function getCourseOwnedByUser(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId).select("_id title instructor");
  if (!course) return null;
  if (role !== "admin" && course.instructor.toString() !== userId) return null;
  return course;
}

// ---------------------------------------------------------------------------
// GET /api/courses/:courseId/announcements
// Accessible by: enrolled students, the course instructor, or admins
// ---------------------------------------------------------------------------
export async function listAnnouncements(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getCourseIdParam(req);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId).select("_id instructor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Allow instructors/admins to view their course announcements without enrollment
    const isOwnerOrAdmin =
      req.user.role === "admin" || course.instructor.toString() === req.user.id;

    if (!isOwnerOrAdmin) {
      // Students must be enrolled
      const enrollment = await Enrollment.exists({
        student: req.user.id,
        course: courseId,
        status: { $in: ["active", "completed"] },
      });
      if (!enrollment) {
        return res.status(403).json({
          message: "You must be enrolled in this course to view announcements.",
        });
      }
    }

    const announcements = await Announcement.find({ course: courseId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ announcements });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/courses/:courseId/announcements
// Accessible by: the course instructor or admin
// ---------------------------------------------------------------------------
export async function createAnnouncement(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getCourseIdParam(req);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const course = await getCourseOwnedByUser(courseId, req.user.id, req.user.role);
    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    const announcement = await Announcement.create({
      course: courseId,
      instructor: req.user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    });

    // Fire-and-forget: notify all active enrolled students
    setImmediate(async () => {
      try {
        const enrollments = await Enrollment.find({
          course: courseId,
          status: { $in: ["active", "completed"] },
        }).select("student");

        if (enrollments.length === 0) return;

        const notifications = enrollments.map((e) => ({
          recipient: e.student,
          title: "New Announcement",
          message: `"${course.title}" has a new announcement: ${parsed.data.title}`,
          type: "info" as const,
          link: `/learn/${courseId}`,
        }));

        await Notification.insertMany(notifications);
      } catch {
        // Notification failures must never affect the main flow
      }
    });

    return res.status(201).json({ message: "Announcement created", announcement });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/courses/:courseId/announcements/:announcementId
// Accessible by: the course instructor or admin
// ---------------------------------------------------------------------------
export async function deleteAnnouncement(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getCourseIdParam(req);
    const { announcementId } = req.params;
    if (!isValidObjectId(courseId) || !isValidObjectId(announcementId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const course = await getCourseOwnedByUser(courseId, req.user.id, req.user.role);
    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    const deleted = await Announcement.findOneAndDelete({
      _id: announcementId,
      course: courseId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.json({ message: "Announcement deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
