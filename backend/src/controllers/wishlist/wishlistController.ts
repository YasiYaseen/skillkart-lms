import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Wishlist from "../../models/Wishlist";
import Course from "../../models/Course";
import Review from "../../models/Review";
import Enrollment from "../../models/Enrollment";
import { addToWishlistSchema } from "../../validators/wishlistValidator";

async function getCourseRatingSummary(courseId: string) {
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

export async function getWishlist(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const items = await Wishlist.find({ student: req.user.id })
      .populate({
        path: "course",
        populate: { path: "instructor", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out any courses that may have been deleted or are unapproved
    const validItems = items.filter((item) => item.course != null);

    interface PopulatedWishlistItem {
      _id: Types.ObjectId;
      createdAt: Date;
      course: {
        _id: Types.ObjectId;
        title: string;
        description?: string;
        thumbnailUrl?: string;
        price?: number;
        level?: string;
        instructor?: { name: string; email: string };
      };
    }

    const enriched = await Promise.all(
      (validItems as unknown as PopulatedWishlistItem[]).map(async (item) => {
        const courseId = item.course._id.toString();
        const [ratingSummary, enrollmentCount] = await Promise.all([
          getCourseRatingSummary(courseId),
          Enrollment.countDocuments({ course: item.course._id }),
        ]);

        return {
          _id: item._id,
          createdAt: item.createdAt,
          course: {
            ...item.course,
            ...ratingSummary,
            enrollmentCount,
          },
        };
      })
    );

    return res.json({ wishlist: enriched });
  } catch (error) {
    console.error("Error in getWishlist:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function addToWishlist(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = addToWishlistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const { courseId } = parsed.data;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published" || course.isActive === false || course.isApproved === false) {
      return res.status(400).json({ message: "Cannot wishlist unavailable course" });
    }

    const wishlistItem = await Wishlist.findOneAndUpdate(
      { student: req.user.id, course: course._id },
      { $setOnInsert: { student: req.user.id, course: course._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      message: "Course added to wishlist",
      wishlistItem,
    });
  } catch (error) {
    console.error("Error in addToWishlist:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function removeFromWishlist(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const result = await Wishlist.findOneAndDelete({
      student: req.user.id,
      course: courseId,
    });

    if (!result) {
      return res.status(404).json({ message: "Course not in wishlist" });
    }

    return res.json({ message: "Course removed from wishlist" });
  } catch (error) {
    console.error("Error in removeFromWishlist:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function checkWishlistStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const exists = await Wishlist.exists({
      student: req.user.id,
      course: courseId,
    });

    return res.json({ isWishlisted: Boolean(exists) });
  } catch (error) {
    console.error("Error in checkWishlistStatus:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
