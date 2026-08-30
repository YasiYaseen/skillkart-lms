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
import Category from "../../models/Category";
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

    let categoryId: Types.ObjectId | undefined = undefined;
    if (data.category) {
      if (isValidObjectId(data.category)) {
        categoryId = new Types.ObjectId(data.category);
      } else {
        const catDoc = await Category.findOne({ slug: data.category });
        if (catDoc) categoryId = catDoc._id as Types.ObjectId;
      }
    }

    const course = await Course.create({
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl || undefined,
      category: categoryId,
      tags: data.tags || [],
      whatYouWillLearn: data.whatYouWillLearn || [],
      prerequisites: data.prerequisites || [],
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
    const { q, search, level, tag, category, priceTier, mine, sort } = req.query as {
      q?: string;
      search?: string;
      level?: string;
      tag?: string;
      category?: string;
      priceTier?: string;
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

    if (category) {
      let catDoc = null;
      if (isValidObjectId(category)) {
        catDoc = await Category.findById(category);
      } else {
        catDoc = await Category.findOne({ slug: category });
      }

      if (catDoc) {
        const categoryFilterConditions: Record<string, unknown>[] = [
          { category: catDoc._id },
        ];
        const catTags = (catDoc.tags || []).map((t) => new RegExp(`^${t.trim()}$`, "i"));
        if (catDoc.tagQuery) {
          catTags.push(new RegExp(`^${catDoc.tagQuery.trim()}$`, "i"));
        }
        if (catTags.length > 0) {
          categoryFilterConditions.push({ tags: { $in: catTags } });
        }

        if (filter.$and) {
          (filter.$and as Array<Record<string, unknown>>).push({ $or: categoryFilterConditions });
        } else {
          filter.$or = categoryFilterConditions;
        }
      }
    }

    if (priceTier === "free") {
      filter.$and = filter.$and || [];
      (filter.$and as Array<Record<string, unknown>>).push({
        $or: [{ isPaid: false }, { price: 0 }, { price: null }],
      });
    } else if (priceTier === "under-20") {
      filter.price = { $gt: 0, $lte: 20 };
    } else if (priceTier === "under-50") {
      filter.price = { $gt: 0, $lte: 50 };
    } else if (priceTier === "paid") {
      filter.price = { $gt: 0 };
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

      if (filter.$and) {
        (filter.$and as Array<Record<string, unknown>>).push({ $or: searchConditions });
      } else {
        filter.$or = searchConditions;
      }
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .populate("category", "name slug icon")
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

    const course = await Course.findById(courseId)
      .populate("instructor", "name email")
      .populate("category", "name slug icon")
      .lean();
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
    const studentCount = await Enrollment.countDocuments({
      course: course._id,
      status: { $in: ["active", "completed"] },
    });

    return res.json({
      course: {
        ...course,
        durationMinutes,
        studentCount,
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

    const allowed = ["title", "description", "thumbnailUrl", "tags", "whatYouWillLearn", "prerequisites", "level", "isPaid", "price", "status"];
    for (const field of allowed) {
      if (field in req.body) {
        (course as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    if ("category" in req.body) {
      if (!req.body.category) {
        course.category = undefined;
      } else if (isValidObjectId(req.body.category)) {
        course.category = new Types.ObjectId(req.body.category);
      } else {
        const catDoc = await Category.findOne({ slug: req.body.category });
        if (catDoc) course.category = catDoc._id as Types.ObjectId;
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

export async function getLearnerDiscoveryFeed(req: Request, res: Response) {
  try {
    const filter: Record<string, unknown> = {
      status: "published",
      isActive: { $ne: false },
      isApproved: { $ne: false },
    };

    const courses = await Course.find(filter)
      .populate("instructor", "name avatar headline email")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const courseId = course._id.toString();
        const [durationMinutes, ratingSummary, enrollmentCount] = await Promise.all([
          getCourseDurationMinutes(courseId),
          getCourseRatingSummary(courseId),
          Enrollment.countDocuments({ course: course._id, status: { $in: ["active", "completed"] } }),
        ]);
        return {
          ...course,
          durationMinutes,
          ...ratingSummary,
          enrollmentCount,
        };
      })
    );

    // 1. Trending: combination of rating & enrollment count
    const trending = [...enriched]
      .sort((a, b) => ((b.averageRating || 0) * 10 + (b.enrollmentCount || 0)) - ((a.averageRating || 0) * 10 + (a.enrollmentCount || 0)))
      .slice(0, 8);

    // 2. Top-rated: highest rating & review count
    const topRated = [...enriched]
      .filter((c) => (c.averageRating || 0) > 0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 8);

    // 3. Free starter courses
    const freeStarters = [...enriched]
      .filter((c) => !c.isPaid || c.price === 0 || c.price === null)
      .slice(0, 8);

    // 4. New releases (latest createdAt)
    const newReleases = [...enriched]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    // 5. Category Tracks with dynamic count (queried from Category model, or multi-disciplinary fallbacks)
    const dbCategories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();

    const fallbackCategories = [
      {
        id: "business",
        name: "Business & Leadership",
        tagQuery: "Business",
        tags: ["business", "management", "leadership", "entrepreneurship", "startup", "strategy"],
        icon: "💼",
        gradient: "from-blue-600/15 via-sky-600/10 to-indigo-900/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
        description: "Executive Leadership, Product Management, Scaling Startups & Agile Strategy",
      },
      {
        id: "finance",
        name: "Finance & Economics",
        tagQuery: "Finance",
        tags: ["finance", "investing", "accounting", "economics", "crypto", "trading", "stock"],
        icon: "📈",
        gradient: "from-emerald-600/15 via-teal-600/10 to-emerald-900/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        description: "Financial Modeling, Stock Valuation, Personal Wealth & Corporate Accounting",
      },
      {
        id: "design",
        name: "Design & Creative Arts",
        tagQuery: "Design",
        tags: ["design", "ui", "ux", "figma", "illustration", "3d", "blender", "animation"],
        icon: "🎨",
        gradient: "from-rose-600/15 via-pink-600/10 to-rose-900/5 border-rose-500/20 text-rose-600 dark:text-rose-400",
        description: "UI/UX, Figma Design Systems, 3D Art, Motion Graphics & Visual Identity",
      },
      {
        id: "tech-code",
        name: "Software & Web Tech",
        tagQuery: "Web Development",
        tags: ["react", "node", "typescript", "javascript", "fullstack", "python", "golang", "devops", "cloud"],
        icon: "💻",
        gradient: "from-purple-600/15 via-violet-600/10 to-purple-900/5 border-purple-500/20 text-purple-600 dark:text-purple-400",
        description: "Full-Stack Development, React, Cloud Microservices & Distributed Architecture",
      },
      {
        id: "ai-data",
        name: "AI & Data Science",
        tagQuery: "AI",
        tags: ["ai", "machine learning", "data science", "deep learning", "llm", "pytorch", "analytics"],
        icon: "🤖",
        gradient: "from-amber-600/15 via-orange-600/10 to-amber-900/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
        description: "Generative AI, Neural Networks, Predictive Analytics & Large Language Models",
      },
      {
        id: "marketing",
        name: "Digital Marketing & Growth",
        tagQuery: "Marketing",
        tags: ["marketing", "growth", "seo", "content", "social media", "branding", "copywriting"],
        icon: "📣",
        gradient: "from-cyan-600/15 via-blue-600/10 to-cyan-900/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
        description: "Growth Hacking, SEO, Brand Positioning, Funnel Optimization & Social Strategy",
      },
    ];

    const sourceCategories = dbCategories.length > 0
      ? dbCategories.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          tagQuery: c.tagQuery || c.name,
          tags: c.tags || [],
          icon: c.icon || "📚",
          gradient: c.gradient || "from-indigo-600/15 via-purple-600/10 to-indigo-900/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
          description: c.description || "",
        }))
      : fallbackCategories;

    const categoryTracks = sourceCategories.map((cat) => {
      const tagList = Array.from(new Set([...cat.tags, cat.tagQuery, cat.name].filter(Boolean))).map((t) => t.toLowerCase());

      const matchingCount = enriched.filter((c) => {
        const titleLower = (c.title || "").toLowerCase();
        const descLower = (c.description || "").toLowerCase();
        const courseTags = (c.tags || []).map((t) => t.toLowerCase());

        return tagList.some(
          (t) => titleLower.includes(t) || descLower.includes(t) || courseTags.some((ct) => ct.includes(t) || t.includes(ct))
        );
      }).length;

      return {
        ...cat,
        courseCount: matchingCount,
      };
    });

    // 6. Featured Instructors
    const instructorMap = new Map<string, {
      _id: string;
      name: string;
      avatar?: string;
      headline?: string;
      courseCount: number;
      studentCount: number;
      ratingAvg: number;
    }>();

    enriched.forEach((c) => {
      const inst = c.instructor as { _id?: Types.ObjectId; name?: string; avatar?: string; headline?: string } | undefined;
      if (inst && inst._id) {
        const idStr = inst._id.toString();
        const existing = instructorMap.get(idStr) || {
          _id: idStr,
          name: inst.name || "Instructor",
          avatar: inst.avatar,
          headline: inst.headline || "Course Creator & Specialist",
          courseCount: 0,
          studentCount: 0,
          ratingAvg: 0,
        };
        existing.courseCount += 1;
        existing.studentCount += c.enrollmentCount || 0;
        existing.ratingAvg = Math.max(existing.ratingAvg, c.averageRating || 0);
        instructorMap.set(idStr, existing);
      }
    });

    const featuredInstructors = Array.from(instructorMap.values())
      .sort((a, b) => b.studentCount - a.studentCount || b.courseCount - a.courseCount)
      .slice(0, 4);

    return res.json({
      trending,
      topRated,
      freeStarters,
      newReleases,
      categoryTracks,
      featuredInstructors,
      totalPublishedCourses: enriched.length,
    });
  } catch (error) {
    console.error("Error in getLearnerDiscoveryFeed:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

