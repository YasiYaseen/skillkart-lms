import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Comment from "../../models/Comment";
import Lesson from "../../models/Lesson";
import Section from "../../models/Section";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";
import Notification from "../../models/Notification";
import { commentSchema } from "../../validators/comment.validator";

function getParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

async function getLessonDetails(lessonId: string) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return null;

  const section = await Section.findById(lesson.section).select("course");
  if (!section) return null;

  const course = await Course.findById(section.course).select("_id title instructor status");
  if (!course) return null;

  return { lesson, section, course };
}

async function canAccessLessonComments(courseId: Types.ObjectId | string, userId: string, role: string, instructorId: Types.ObjectId | string) {
  if (role === "admin" || instructorId.toString() === userId) {
    return true;
  }

  const enrollment = await Enrollment.exists({
    student: userId,
    course: courseId,
    status: "active",
  });

  return Boolean(enrollment);
}

// ---------------------------------------------------------------------------
// GET /api/lessons/:lessonId/comments
// ---------------------------------------------------------------------------
export async function getLessonComments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = getParam(req.params.lessonId);
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const details = await getLessonDetails(lessonId);
    if (!details) {
      return res.status(404).json({ message: "Lesson or course not found" });
    }

    const hasAccess = await canAccessLessonComments(
      details.course._id,
      req.user.id,
      req.user.role,
      details.course.instructor
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You must be actively enrolled in this course to view discussions.",
      });
    }

    // Fetch all comments for this lesson, populated with user info
    const comments = await Comment.find({ lesson: lessonId })
      .populate("user", "name role avatar")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ comments });
  } catch (error) {
    console.error("Error in getLessonComments:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/lessons/:lessonId/comments
// ---------------------------------------------------------------------------
export async function createLessonComment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = getParam(req.params.lessonId);
    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const details = await getLessonDetails(lessonId);
    if (!details) {
      return res.status(404).json({ message: "Lesson or course not found" });
    }

    const hasAccess = await canAccessLessonComments(
      details.course._id,
      req.user.id,
      req.user.role,
      details.course.instructor
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You must be actively enrolled in this course to participate in discussions.",
      });
    }

    let parentCommentDoc = null;
    if (parsed.data.parentCommentId) {
      if (!isValidObjectId(parsed.data.parentCommentId)) {
        return res.status(400).json({ message: "Invalid parent comment id" });
      }

      parentCommentDoc = await Comment.findOne({
        _id: parsed.data.parentCommentId,
        lesson: lessonId,
      });

      if (!parentCommentDoc) {
        return res.status(404).json({ message: "Parent comment not found for this lesson" });
      }
    }

    const newComment = await Comment.create({
      lesson: new Types.ObjectId(lessonId),
      course: details.course._id,
      user: new Types.ObjectId(req.user.id),
      content: parsed.data.content,
      parentComment: parentCommentDoc ? (parentCommentDoc._id as Types.ObjectId) : undefined,
    });

    const populated = await Comment.findById(newComment._id)
      .populate("user", "name role avatar")
      .lean();


    // Fire-and-forget notification dispatch
    setImmediate(async () => {
      try {
        if (parentCommentDoc) {
          // Notify the author of the parent comment if it's someone else replying
          if (parentCommentDoc.user.toString() !== req.user!.id) {
            await Notification.create({
              recipient: parentCommentDoc.user,
              title: "New Reply on Your Comment",
              message: `Someone replied to your comment on lesson "${details.lesson.title}".`,
              type: "info",
              link: `/learn/${details.course._id}/${lessonId}`,
            });
          }
        } else {
          // Notify instructor if a student posted a top-level question
          if (details.course.instructor.toString() !== req.user!.id) {
            await Notification.create({
              recipient: details.course.instructor,
              title: "New Question in Lesson",
              message: `A student asked a question on "${details.lesson.title}" in "${details.course.title}".`,
              type: "info",
              link: `/learn/${details.course._id}/${lessonId}`,
            });
          }
        }
      } catch (notifyErr) {
        console.error("Error creating comment notification:", notifyErr);
      }
    });

    return res.status(201).json({
      message: "Comment posted successfully",
      comment: populated,
    });
  } catch (error) {
    console.error("Error in createLessonComment:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/lessons/:lessonId/comments/:commentId
// ---------------------------------------------------------------------------
export async function deleteLessonComment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lessonId = getParam(req.params.lessonId);
    const commentId = getParam(req.params.commentId);

    if (!isValidObjectId(lessonId) || !isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const comment = await Comment.findOne({ _id: commentId, lesson: lessonId });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const details = await getLessonDetails(lessonId);
    if (!details) {
      return res.status(404).json({ message: "Lesson or course not found" });
    }

    const isAuthor = comment.user.toString() === req.user.id;
    const isInstructor = details.course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isInstructor && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to delete this comment.",
      });
    }

    // Delete comment and any replies referencing it
    await Promise.all([
      Comment.findByIdAndDelete(commentId),
      Comment.deleteMany({ parentComment: commentId }),
    ]);

    return res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteLessonComment:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
