import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import User from "../../models/User";
import Course from "../../models/Course";
import Review from "../../models/Review";
import Enrollment from "../../models/Enrollment";
import { getTodayDateString } from "../../services/streakService";

export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { name, bio, headline, avatar, interests, socialLinks } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      user.name = trimmedName;
    }

    if (headline !== undefined) user.headline = String(headline).trim().slice(0, 120);
    if (bio !== undefined) user.bio = String(bio).trim().slice(0, 500);
    if (avatar !== undefined) user.avatar = String(avatar).trim();
    if (Array.isArray(interests)) user.interests = interests.map(i => String(i).trim());
    if (socialLinks && typeof socialLinks === "object") {
      user.socialLinks = {
        website: socialLinks.website ? String(socialLinks.website).trim() : undefined,
        linkedin: socialLinks.linkedin ? String(socialLinks.linkedin).trim() : undefined,
        twitter: socialLinks.twitter ? String(socialLinks.twitter).trim() : undefined,
      };
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        headline: user.headline,
        bio: user.bio,
        interests: user.interests,
        socialLinks: user.socialLinks,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getPublicInstructorProfile(req: Request, res: Response) {
  try {
    const { instructorId } = req.params;
    if (!isValidObjectId(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor ID" });
    }

    const instructor = await User.findOne({
      _id: instructorId,
      isActive: true,
      role: { $in: ["instructor", "admin"] },
    }).select("name avatar headline bio interests socialLinks createdAt");

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    const courses = await Course.find({
      instructor: instructorId,
      status: "published",
      isActive: true,
      isApproved: true,
    })
      .select("_id title description thumbnailUrl price isPaid level tags createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    const courseIds = courses.map((c) => c._id);

    const [reviews, enrollments] = await Promise.all([
      Review.find({ course: { $in: courseIds } }).lean(),
      Enrollment.find({ course: { $in: courseIds } }).lean(),
    ]);

    const reviewMap = new Map<string, { count: number; sum: number }>();
    reviews.forEach((r) => {
      const cId = r.course.toString();
      const current = reviewMap.get(cId) || { count: 0, sum: 0 };
      current.count += 1;
      current.sum += r.rating;
      reviewMap.set(cId, current);
    });

    const enrollmentMap = new Map<string, number>();
    enrollments.forEach((e) => {
      const cId = e.course.toString();
      enrollmentMap.set(cId, (enrollmentMap.get(cId) || 0) + 1);
    });

    const enrichedCourses = courses.map((course) => {
      const cId = course._id.toString();
      const rev = reviewMap.get(cId) || { count: 0, sum: 0 };
      const avg = rev.count > 0 ? Math.round((rev.sum / rev.count) * 10) / 10 : 0;
      const enrolledCount = enrollmentMap.get(cId) || 0;

      return {
        ...course,
        averageRating: avg,
        reviewCount: rev.count,
        enrollmentCount: enrolledCount,
      };
    });

    const totalStudents = enrollments.length;
    const totalReviews = reviews.length;
    const totalReviewSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const overallAverageRating =
      totalReviews > 0 ? Math.round((totalReviewSum / totalReviews) * 10) / 10 : 0;

    return res.json({
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        avatar: instructor.avatar,
        headline: instructor.headline,
        bio: instructor.bio,
        interests: instructor.interests,
        socialLinks: instructor.socialLinks,
        joinedDate: instructor.createdAt,
      },
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalReviews,
        averageRating: overallAverageRating,
      },
      courses: enrichedCourses,
    });
  } catch (error) {
    console.error("Error in getPublicInstructorProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getStudentStreak(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.id).select(
      "currentStreak longestStreak lastActiveDate activeDates"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const todayStr = getTodayDateString();
    const activeDatesSet = new Set(user.activeDates || []);

    // Generate past 7 days activity (ending today)
    const past7Days: Array<{ date: string; dayName: string; isActive: boolean }> = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayName = dayNames[d.getDay()];

      past7Days.push({
        date: dateStr,
        dayName,
        isActive: activeDatesSet.has(dateStr),
      });
    }

    return res.json({
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActiveDate: user.lastActiveDate || null,
      isActiveToday: activeDatesSet.has(todayStr),
      totalActiveDays: (user.activeDates || []).length,
      past7Days,
    });
  } catch (error) {
    console.error("Error in getStudentStreak:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function recordRecentlyViewedCourse(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const courseExists = await Course.exists({ _id: courseId, isActive: true, status: "published" });
    if (!courseExists) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
    const currentList = (user.recentlyViewedCourses || []).map((id) => id.toString());
    const filteredList = currentList.filter((id) => id !== cIdStr);
    filteredList.unshift(cIdStr);

    user.recentlyViewedCourses = filteredList.slice(0, 10).map((id) => new Types.ObjectId(id));
    await user.save();

    return res.json({ message: "Recorded recently viewed course", courseId: cIdStr });
  } catch (error) {
    console.error("Error in recordRecentlyViewedCourse:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getRecentlyViewedCourses(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.id).populate({
      path: "recentlyViewedCourses",
      match: { isActive: true, status: "published" },
      populate: { path: "instructor", select: "name avatar" },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const validCourses = (user.recentlyViewedCourses || []) as unknown as Array<{
      _id: Types.ObjectId;
      title: string;
      thumbnailUrl?: string;
      price?: number;
      level?: string;
      instructor?: { name: string };
    }>;

    return res.json({ courses: validCourses });
  } catch (error) {
    console.error("Error in getRecentlyViewedCourses:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

