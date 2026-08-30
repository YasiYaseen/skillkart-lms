import type { Request, Response } from "express";
import { Types, isValidObjectId } from "mongoose";
import Course from "../../models/Course";
import Section from "../../models/Section";
import Lesson from "../../models/Lesson";
import LessonItem from "../../models/LessonItem";
import Enrollment from "../../models/Enrollment";
import LessonProgress from "../../models/LessonProgress";
import Review from "../../models/Review";
import User from "../../models/User";
import Note from "../../models/Note";
import Bookmark from "../../models/Bookmark";
import Announcement from "../../models/Announcement";
import Comment from "../../models/Comment";
import Certificate from "../../models/Certificate";
import { getCourseDurationMinutes, isCourseManager } from "./shared";
import { createCourseSchema } from "../../validators/course.validator";


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

export async function createCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    if (data.isPaid && (!data.price || data.price <= 0)) {
      return res.status(400).json({
        message: "Valid price required for paid course",
      });
    }

    const course = await Course.create({
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl || undefined,
      tags: data.tags || [],
      level: data.level || "beginner",
      isPaid: data.isPaid,
      price: data.isPaid ? data.price : null,
      instructor: req.user.id,
      status: "draft",
    });

    return res.status(201).json({
      message: "Course created",
      course,
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourses(req: Request, res: Response) {
  try {
    const { q, search, level, tag, mine, sort } = req.query as {
      q?: string;
      search?: string;
      level?: string;
      tag?: string;
      mine?: string;
      sort?: string;
    };
    const searchQuery = (q || search || "").trim();
    const filter: Record<string, unknown> = {};

    if (mine === "true") {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (req.user.role === "instructor") {
        filter.instructor = req.user.id;
      }
    } else {
      filter.status = "published";
      filter.isActive = { $ne: false };
      filter.isApproved = { $ne: false };
    }

    if (level) {
      filter.level = level;
    }

    if (tag) {
      filter.tags = { $in: [new RegExp(`^${tag.trim()}$`, "i")] };
    }

    if (searchQuery) {
      // Find instructors matching the search term
      const matchingUsers = await User.find({
        name: { $regex: searchQuery, $options: "i" },
      }).select("_id");
      const matchingInstructorIds = matchingUsers.map((u) => u._id);

      const searchRegex = new RegExp(searchQuery, "i");
      const searchConditions: Record<string, unknown>[] = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];

      if (matchingInstructorIds.length > 0) {
        searchConditions.push({ instructor: { $in: matchingInstructorIds } });
      }

      filter.$or = searchConditions;
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Also get all distinct tags across published courses for filter chips
    const allPublishedCourses = await Course.find({
      status: "published",
      isActive: { $ne: false },
      isApproved: { $ne: false },
    })
      .select("tags")
      .lean();

    const tagSet = new Set<string>();
    allPublishedCourses.forEach((c) => {
      (c.tags || []).forEach((t) => {
        if (t && t.trim()) tagSet.add(t.trim());
      });
    });
    const availableTags = Array.from(tagSet);

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const courseId = course._id.toString();
        const [durationMinutes, ratingSummary, enrollmentCount] = await Promise.all([
          getCourseDurationMinutes(courseId),
          getCourseRatingSummary(courseId),
          Enrollment.countDocuments({ course: course._id }),
        ]);
        return { ...course, durationMinutes, ...ratingSummary, enrollmentCount };
      })
    );

    // Sort after enrichment so we can sort by computed fields
    if (sort === "popular") {
      enriched.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0));
    } else if (sort === "free") {
      enriched.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === "highest-rated") {
      enriched.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    }
    // default: already sorted by createdAt desc from DB

    return res.json({ courses: enriched, tags: availableTags });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}


export async function getCourseById(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId).populate("instructor", "name email").lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published" || course.isActive === false || course.isApproved === false) {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!isCourseManager(req.user.id, req.user.role, course.instructor._id.toString())) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const sections = await Section.find({ course: course._id }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((section) => section._id);
    const lessons = sectionIds.length
      ? await Lesson.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean()
      : [];
    const lessonIds = lessons.map((lesson) => lesson._id);
    let isEnrolledOrManager = false;
    if (req.user) {
      if (isCourseManager(req.user.id, req.user.role, course.instructor._id.toString())) {
        isEnrolledOrManager = true;
      } else {
        const enrollment = await Enrollment.findOne({
          student: req.user.id,
          course: course._id,
          status: { $in: ["active", "completed"] },
        });
        if (enrollment) isEnrolledOrManager = true;
      }
    }

    const lessonItems = (lessonIds.length && isEnrolledOrManager)
      ? await LessonItem.find({ lesson: { $in: lessonIds } }).sort({ order: 1 }).lean()
      : [];

    const durationMinutes = lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0);
    const ratingSummary = await getCourseRatingSummary(course._id.toString());

    return res.json({
      course: {
        ...course,
        durationMinutes,
        ...ratingSummary,
        sections,
        lessons,
        lessonItems,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = ["title", "description", "thumbnailUrl", "tags", "level", "isPaid", "price", "status"];
    for (const field of allowed) {
      if (field in req.body) {
        (course as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }


    if (!course.isPaid) {
      course.price = null;
    }
    if (course.isPaid && (course.price === null || course.price === undefined)) {
      return res.status(400).json({ message: "price is required for paid courses" });
    }

    await course.save();
    return res.json({ message: "Course updated", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function publishCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const hasSection = await Section.exists({ course: course._id });
    if (!hasSection) {
      return res.status(400).json({ message: "Cannot publish a course without sections" });
    }

    course.status = "published";
    course.publishedAt = new Date();
    await course.save();

    return res.json({ message: "Course published", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function unpublishCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    course.status = "draft";
    course.publishedAt = undefined;
    await course.save();

    return res.json({ message: "Course moved to draft", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function archiveCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    course.status = "archived";
    await course.save();

    return res.json({ message: "Course archived", course });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isCourseManager(req.user.id, req.user.role, course.instructor.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const sections = await Section.find({ course: course._id }).select("_id");
    const sectionIds = sections.map((section) => section._id);
    const lessons = sectionIds.length ? await Lesson.find({ section: { $in: sectionIds } }).select("_id") : [];
    const lessonIds = lessons.map((lesson) => lesson._id);

    await LessonProgress.deleteMany({ lesson: { $in: lessonIds } });
    await LessonItem.deleteMany({ lesson: { $in: lessonIds } });
    await Comment.deleteMany({ lesson: { $in: lessonIds } });
    await Note.deleteMany({ course: course._id });
    await Bookmark.deleteMany({ course: course._id });
    await Announcement.deleteMany({ course: course._id });
    await Certificate.deleteMany({ course: course._id });
    await Lesson.deleteMany({ section: { $in: sectionIds } });
    await Section.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await Review.deleteMany({ course: course._id });
    await Course.deleteOne({ _id: course._id });

    return res.json({ message: "Course deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCourseRecommendations(req: Request, res: Response) {
  try {
    const filter: Record<string, unknown> = {
      status: "published",
      isActive: { $ne: false },
      isApproved: { $ne: false },
    };

    let userInterests: string[] = [];

    if (req.user) {
      const [userEnrollments, userDoc] = await Promise.all([
        Enrollment.find({
          student: req.user.id,
          status: { $in: ["active", "completed"] },
        })
          .select("course")
          .lean(),
        User.findById(req.user.id).select("interests").lean(),
      ]);

      const enrolledCourseIds = userEnrollments.map((e) => e.course);
      if (enrolledCourseIds.length > 0) {
        filter._id = { $nin: enrolledCourseIds };
      }
      if (userDoc?.interests && Array.isArray(userDoc.interests)) {
        userInterests = userDoc.interests.map((i) => i.toLowerCase().trim()).filter(Boolean);
      }
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name avatar email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (courses.length === 0) {
      return res.json({ recommendations: [] });
    }

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const courseId = course._id.toString();
        const [durationMinutes, ratingSummary, enrollmentCount] = await Promise.all([
          getCourseDurationMinutes(courseId),
          getCourseRatingSummary(courseId),
          Enrollment.countDocuments({ course: course._id }),
        ]);

        let score = (ratingSummary.averageRating || 0) * 10 + Math.min(enrollmentCount, 50);

        // Boost interest match
        if (userInterests.length > 0) {
          const courseTags = (course.tags || []).map((t) => t.toLowerCase());
          const matchCount = userInterests.filter((interest) =>
            courseTags.some((tag) => tag.includes(interest) || interest.includes(tag))
          ).length;
          score += matchCount * 25;
        }

        return {
          ...course,
          durationMinutes,
          ...ratingSummary,
          enrollmentCount,
          recommendationScore: score,
        };
      })
    );

    enriched.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const recommendations = enriched.slice(0, 6);

    return res.json({ recommendations });
  } catch (error) {
    console.error("Error in getCourseRecommendations:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

