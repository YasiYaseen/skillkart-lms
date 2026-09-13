import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Cart from "../models/Cart";
import Course, { type ICourse } from "../models/Course";
import Enrollment from "../models/Enrollment";
import { addToCartSchema, mergeCartSchema } from "../validators/cartValidator";
import {
  isCourseApprovalRequired,
  getCourseApprovalFilter,
  isCoursePubliclyAccessible,
} from "./course/shared";

interface PopulatedCourseDoc {
  _id: Types.ObjectId;
  title: string;
  price?: number;
  thumbnailUrl?: string;
  isPaid?: boolean;
  status?: string;
  isActive?: boolean;
  isApproved?: boolean;
  instructor?: {
    _id: Types.ObjectId;
    name: string;
  };
}

interface FormattedCartItem {
  courseId: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
  instructorName?: string;
  addedAt: Date;
}

function formatCartItems(
  items: Array<{ course: any; addedAt: Date }>,
  requireApproval: boolean,
  currentUserId?: string
): FormattedCartItem[] {
  const seen = new Set<string>();
  const result: FormattedCartItem[] = [];

  for (const item of items) {
    const course = item.course as PopulatedCourseDoc | null;
    if (
      course &&
      course._id &&
      isCoursePubliclyAccessible(course, requireApproval)
    ) {
      const instructorId = course.instructor?._id
        ? course.instructor._id.toString()
        : course.instructor?.toString();
      if (currentUserId && instructorId === currentUserId) {
        continue;
      }
      const idStr = course._id.toString();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        result.push({
          courseId: idStr,
          title: course.title,
          price: typeof course.price === "number" ? course.price : 0,
          thumbnailUrl: course.thumbnailUrl,
          instructorName: course.instructor?.name || "SkillKart Instructor",
          addedAt: item.addedAt,
        });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// GET /api/cart
// Retrieve the authenticated student's cart
// ---------------------------------------------------------------------------
export async function getCart(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;

    let cart = await Cart.findOne({ student: userId }).populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    if (!cart) {
      return res.json({ items: [] });
    }

    const requireApproval = await isCourseApprovalRequired();

    // Check for courses student is already actively enrolled in
    const courseIdsInCart = cart.items
      .map((item) => {
        const c = (item.course as unknown) as PopulatedCourseDoc | null;
        return c?._id;
      })
      .filter((id): id is Types.ObjectId => id != null);

    let enrolledCourseIds = new Set<string>();
    if (courseIdsInCart.length > 0) {
      const activeEnrollments = await Enrollment.find({
        student: userId,
        course: { $in: courseIdsInCart },
        status: { $in: ["active", "completed"] },
      }).select("course").lean();
      enrolledCourseIds = new Set(activeEnrollments.map((e) => e.course.toString()));
    }

    // Prune unpurchasable, deleted, self-authored, or already-enrolled courses from database cart
    const validItems = cart.items.filter((item) => {
      const course = (item.course as unknown) as PopulatedCourseDoc | null;
      if (!course || !course._id || !isCoursePubliclyAccessible(course, requireApproval)) {
        return false;
      }
      const courseIdStr = course._id.toString();
      if (enrolledCourseIds.has(courseIdStr)) {
        return false;
      }
      const instructorId = course.instructor?._id
        ? course.instructor._id.toString()
        : course.instructor?.toString();
      if (instructorId && instructorId === userId) {
        return false;
      }
      return true;
    });

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save().catch((err) => {
        console.error("Error saving pruned cart:", err);
      });
    }

    const formattedItems = formatCartItems(validItems, requireApproval, userId);
    return res.json({ items: formattedItems });
  } catch (error) {
    console.error("Error in getCart:", error);
    return res.status(500).json({ message: "Failed to retrieve cart" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/cart/items
// Add a course to the authenticated student's cart
// ---------------------------------------------------------------------------
export async function addToCart(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = addToCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const { courseId } = parsed.data;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Verify course exists and is available
    const course = await Course.findById(courseId).select("_id title status isActive isApproved isPaid price instructor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // AUDIT-21: Prevent instructor self-purchase
    if (course.instructor && course.instructor.toString() === req.user.id) {
      return res.status(400).json({ message: "Instructors cannot purchase their own courses." });
    }

    const requireApproval = await isCourseApprovalRequired();
    if (!isCoursePubliclyAccessible(course, requireApproval)) {
      return res.status(400).json({ message: "This course is currently unavailable for purchase." });
    }

    // AUDIT-62: Only block if active or completed enrollment exists (allow repurchasing cancelled enrollments)
    const activeEnrollment = await Enrollment.exists({
      student: req.user.id,
      course: course._id,
      status: { $in: ["active", "completed"] },
    });
    if (activeEnrollment) {
      return res.status(400).json({ message: "You are already enrolled in this course." });
    }

    // Find or create cart
    let cart = await Cart.findOne({ student: req.user.id });
    if (!cart) {
      cart = new Cart({
        student: req.user.id,
        items: [],
      });
    }

    // Sanitize any existing duplicates in cart items
    const seenCourseIds = new Set<string>();
    const uniqueItems: typeof cart.items = [];
    for (const item of cart.items) {
      if (item && item.course) {
        const idStr = item.course.toString();
        if (!seenCourseIds.has(idStr)) {
          seenCourseIds.add(idStr);
          uniqueItems.push(item);
        }
      }
    }
    const hadDuplicates = uniqueItems.length !== cart.items.length;
    cart.items = uniqueItems;

    // Check if item is already in cart
    const targetCourseId = course._id.toString();
    const alreadyInCart = seenCourseIds.has(targetCourseId);

    if (!alreadyInCart) {
      cart.items.push({
        course: course._id as Types.ObjectId,
        addedAt: new Date(),
      });
      await cart.save();
    } else if (hadDuplicates) {
      await cart.save();
    }

    // Return populated cart
    await cart.populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    const formattedItems = formatCartItems(cart.items, requireApproval, req.user.id);
    return res.status(200).json({
      message: "Course added to cart",
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    return res.status(500).json({ message: "Failed to add course to cart" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/cart/items/:courseId
// Remove a course from the authenticated student's cart
// ---------------------------------------------------------------------------
export async function removeFromCart(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const cart = await Cart.findOne({ student: req.user.id });
    if (!cart) {
      return res.json({ message: "Course removed from cart", items: [] });
    }

    cart.items = cart.items.filter(
      (item) => item.course && item.course.toString() !== courseId
    );
    await cart.save();

    await cart.populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    const requireApproval = await isCourseApprovalRequired();
    const formattedItems = formatCartItems(cart.items, requireApproval, req.user.id);
    return res.json({
      message: "Course removed from cart",
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    return res.status(500).json({ message: "Failed to remove course from cart" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/cart
// Clear all items from the authenticated student's cart
// ---------------------------------------------------------------------------
export async function clearCart(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Cart.findOneAndUpdate(
      { student: req.user.id },
      { $set: { items: [] } },
      { upsert: true }
    );

    return res.json({ message: "Cart cleared successfully", items: [] });
  } catch (error) {
    console.error("Error in clearCart:", error);
    return res.status(500).json({ message: "Failed to clear cart" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/cart/merge
// Merge guest cart courses into the user's persistent backend cart upon login
// ---------------------------------------------------------------------------
export async function mergeCart(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = mergeCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const { courseIds } = parsed.data;
    // Deduplicate valid course IDs passed in the request
    const validCourseIds = Array.from(
      new Set(courseIds.filter((id) => isValidObjectId(id)))
    );

    let cart = await Cart.findOne({ student: req.user.id });
    if (!cart) {
      cart = new Cart({
        student: req.user.id,
        items: [],
      });
    }

    // Sanitize any existing duplicates in user's cart
    const existingCartCourseIds = new Set<string>();
    const uniqueItems: typeof cart.items = [];
    for (const item of cart.items) {
      if (item && item.course) {
        const idStr = item.course.toString();
        if (!existingCartCourseIds.has(idStr)) {
          existingCartCourseIds.add(idStr);
          uniqueItems.push(item);
        }
      }
    }
    const hadExistingDuplicates = uniqueItems.length !== cart.items.length;
    cart.items = uniqueItems;

    let itemsModified = hadExistingDuplicates;

    if (validCourseIds.length > 0) {
      // Find existing enrollments so we don't add courses the student already owns
      const enrollments = await Enrollment.find({
        student: req.user.id,
        course: { $in: validCourseIds },
        status: { $in: ["active", "completed"] },
      }).select("course").lean();

      const enrolledCourseIdSet = new Set(
        enrollments.map((e) => e.course.toString())
      );

      // Verify active/published courses (AUDIT-56: filter out instructor-owned courses)
      const approvalFilter = await getCourseApprovalFilter();
      const validCourses = await Course.find({
        _id: { $in: validCourseIds },
        instructor: { $ne: new Types.ObjectId(req.user.id) },
        status: "published",
        isActive: { $ne: false },
        ...approvalFilter,
      }).select("_id").lean();

      for (const course of validCourses) {
        const cId = course._id.toString();
        if (!existingCartCourseIds.has(cId) && !enrolledCourseIdSet.has(cId)) {
          cart.items.push({
            course: course._id as Types.ObjectId,
            addedAt: new Date(),
          });
          existingCartCourseIds.add(cId);
          itemsModified = true;
        }
      }
    }

    if (itemsModified) {
      await cart.save();
    }

    await cart.populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    const requireApproval = await isCourseApprovalRequired();
    const formattedItems = formatCartItems(cart.items, requireApproval, req.user.id);
    return res.json({
      message: "Cart merged successfully",
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error in mergeCart:", error);
    return res.status(500).json({ message: "Failed to merge cart" });
  }
}
