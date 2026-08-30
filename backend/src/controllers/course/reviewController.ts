import type { Request, Response } from "express";
import { Types, isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Enrollment from "../../models/Enrollment";
import Review from "../../models/Review";
import Notification from "../../models/Notification";
import { reviewSchema } from "../../validators/review.validator";

async function getReviewSummary(courseId: string) {
  const [summary] = await Review.aggregate<{ averageRating: number; reviewCount: number }>([
    { $match: { course: new Types.ObjectId(courseId) } },
    {
      $group: {
        _id: "$course",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  return {
    averageRating: summary ? Math.round(summary.averageRating * 10) / 10 : 0,
    reviewCount: summary?.reviewCount || 0,
  };
}

async function canReviewCourse(courseId: string, studentId: string) {
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: studentId,
    status: { $in: ["active", "completed"] },
  }).select("_id");

  return Boolean(enrollment);
}

function getCourseIdParam(req: Request) {
  const { courseId } = req.params;
  return Array.isArray(courseId) ? courseId[0] : courseId;
}

export async function listCourseReviews(req: Request, res: Response) {
  try {
    const courseId = getCourseIdParam(req);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.exists({ _id: courseId, status: "published" });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const [summary, reviews] = await Promise.all([
      getReviewSummary(courseId),
      Review.find({ course: courseId })
        .populate("student", "_id name")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.json({ ...summary, reviews });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createCourseReview(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getCourseIdParam(req);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const course = await Course.exists({ _id: courseId, status: "published" });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const allowed = await canReviewCourse(courseId, req.user.id);
    if (!allowed) {
      return res.status(403).json({ message: "Only enrolled students can review this course" });
    }

    const existingReview = await Review.exists({ course: courseId, student: req.user.id });
    if (existingReview) {
      return res.status(409).json({ message: "You have already reviewed this course" });
    }

    const review = await Review.create({
      course: courseId,
      student: req.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    // Determine course instructor to notify
    const courseObj = await Course.findById(courseId).select("title instructor");
    if (courseObj) {
      await Notification.create({
        recipient: courseObj.instructor,
        title: "New Course Review",
        message: `A student left a ${parsed.data.rating}-star review on "${courseObj.title}".`,
        type: "info",
        link: `/courses/${courseId}`,
      });
    }

    return res.status(201).json({
      message: "Review created",
      review,
      summary: await getReviewSummary(courseId),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourseReview(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getCourseIdParam(req);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const review = await Review.findOne({ course: courseId, student: req.user.id });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const allowed = await canReviewCourse(courseId, req.user.id);
    if (!allowed) {
      return res.status(403).json({ message: "Only enrolled students can update this review" });
    }

    review.rating = parsed.data.rating;
    review.comment = parsed.data.comment;
    await review.save();

    return res.json({
      message: "Review updated",
      review,
      summary: await getReviewSummary(courseId),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCourseReview(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = getCourseIdParam(req);
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const review = await Review.findOne({ course: courseId, student: req.user.id });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await Review.findByIdAndDelete(review._id);

    return res.json({
      message: "Review deleted successfully",
      summary: await getReviewSummary(courseId),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
