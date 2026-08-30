import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { z } from "zod";
import Category from "../../models/Category";
import Course from "../../models/Course";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  icon: z.string().default("📚"),
  description: z.string().max(300).default(""),
  gradient: z.string().optional(),
  tagQuery: z.string().optional(),
  tags: z.array(z.string()).default([]),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * Public: Get all active categories with live course counts
 */
export async function getPublicCategories(req: Request, res: Response) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();

    const publishedCourses = await Course.find({
      status: "published",
      isActive: { $ne: false },
      isApproved: { $ne: false },
    }).select("title description tags").lean();

    const enriched = categories.map((cat) => {
      const tagSet = new Set((cat.tags || []).map((t) => t.toLowerCase()));
      if (cat.tagQuery) tagSet.add(cat.tagQuery.toLowerCase());
      tagSet.add(cat.name.toLowerCase());

      const matchingCount = publishedCourses.filter((c) => {
        const titleLower = (c.title || "").toLowerCase();
        const descLower = (c.description || "").toLowerCase();
        const courseTags = (c.tags || []).map((t) => t.toLowerCase());

        return Array.from(tagSet).some(
          (t) => titleLower.includes(t) || descLower.includes(t) || courseTags.some((ct) => ct.includes(t) || t.includes(ct))
        );
      }).length;

      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        gradient: cat.gradient || "from-indigo-600/15 via-purple-600/10 to-indigo-900/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
        tagQuery: cat.tagQuery || cat.name,
        tags: cat.tags,
        order: cat.order,
        courseCount: matchingCount,
      };
    });

    return res.json({ categories: enriched });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
}

/**
 * Admin: Get all categories (including inactive) with live course count stats
 */
export async function getAdminCategories(req: Request, res: Response) {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: -1 }).lean();

    const allCourses = await Course.find().select("category title description tags status").lean();

    const enriched = categories.map((cat) => {
      const catIdStr = cat._id.toString();
      const tagSet = new Set((cat.tags || []).map((t) => t.toLowerCase()));
      if (cat.tagQuery) tagSet.add(cat.tagQuery.toLowerCase());
      tagSet.add(cat.name.toLowerCase());

      const matchingCourses = allCourses.filter((c) => {
        // Direct category relation
        if (c.category && c.category.toString() === catIdStr) return true;

        // Tag or title/description affinity
        const titleLower = (c.title || "").toLowerCase();
        const descLower = (c.description || "").toLowerCase();
        const courseTags = (c.tags || []).map((t) => t.toLowerCase());

        return Array.from(tagSet).some(
          (t) => titleLower.includes(t) || descLower.includes(t) || courseTags.some((ct) => ct.includes(t) || t.includes(ct))
        );
      });

      const publishedCount = matchingCourses.filter((c) => c.status === "published").length;

      return {
        ...cat,
        courseCount: matchingCourses.length,
        publishedCount,
      };
    });

    return res.json({ categories: enriched });
  } catch (error) {
    console.error("Error fetching admin categories:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
}

/**
 * Admin: Create a new category
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const { slug } = parsed.data;
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "A category with this slug already exists" });
    }

    const category = await Category.create(parsed.data);
    return res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
}

/**
 * Admin: Update category
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    if (parsed.data.slug) {
      const existing = await Category.findOne({
        slug: parsed.data.slug,
        _id: { $ne: new Types.ObjectId(categoryId as string) },
      });
      if (existing) {
        return res.status(400).json({ message: "A category with this slug already exists" });
      }
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Failed to update category" });
  }
}

/**
 * Admin: Delete category
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
}
