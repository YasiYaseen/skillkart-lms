import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Cart from "../models/Cart";
import Course, { type ICourse } from "../models/Course";
import Enrollment from "../models/Enrollment";
import { addToCartSchema, mergeCartSchema } from "../validators/cartValidator";

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

function formatCartItems(items: Array<{ course: any; addedAt: Date }>): FormattedCartItem[] {
  return items
    .filter((item) => {
      const course = item.course as PopulatedCourseDoc | null;
      return (
        course &&
        course._id &&
        course.status === "published" &&
        course.isActive !== false &&
        course.isApproved !== false
      );
    })
    .map((item) => {
      const course = item.course as PopulatedCourseDoc;
      return {
        courseId: course._id.toString(),
        title: course.title,
        price: typeof course.price === "number" ? course.price : 0,
        thumbnailUrl: course.thumbnailUrl,
        instructorName: course.instructor?.name || "SkillKart Instructor",
        addedAt: item.addedAt,
      };
    });
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

    let cart = await Cart.findOne({ student: req.user.id }).populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    if (!cart) {
      return res.json({ items: [] });
    }

    const formattedItems = formatCartItems(cart.items);
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
    const course = await Course.findById(courseId).select("_id title status isActive isApproved isPaid price");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published" || course.isActive === false || course.isApproved === false) {
      return res.status(400).json({ message: "This course is currently unavailable for purchase." });
    }

    // Check if already enrolled
    const isEnrolled = await Enrollment.exists({
      student: req.user.id,
      course: course._id,
    });
    if (isEnrolled) {
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

    // Check if item is already in cart
    const alreadyInCart = cart.items.some(
      (item) => item.course.toString() === course._id.toString()
    );

    if (!alreadyInCart) {
      cart.items.push({
        course: course._id as Types.ObjectId,
        addedAt: new Date(),
      });
      await cart.save();
    }

    // Return populated cart
    await cart.populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    const formattedItems = formatCartItems(cart.items);
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
      (item) => item.course.toString() !== courseId
    );
    await cart.save();

    await cart.populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    const formattedItems = formatCartItems(cart.items);
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
    const validCourseIds = courseIds.filter((id) => isValidObjectId(id));

    let cart = await Cart.findOne({ student: req.user.id });
    if (!cart) {
      cart = new Cart({
        student: req.user.id,
        items: [],
      });
    }

    if (validCourseIds.length > 0) {
      // Find existing enrollments so we don't add courses the student already owns
      const enrollments = await Enrollment.find({
        student: req.user.id,
        course: { $in: validCourseIds },
      }).select("course").lean();

      const enrolledCourseIdSet = new Set(
        enrollments.map((e) => e.course.toString())
      );

      // Verify active/published courses
      const validCourses = await Course.find({
        _id: { $in: validCourseIds },
        status: "published",
        isActive: { $ne: false },
        isApproved: { $ne: false },
      }).select("_id").lean();

      const existingCartCourseIds = new Set(
        cart.items.map((item) => item.course.toString())
      );

      for (const course of validCourses) {
        const cId = course._id.toString();
        if (!existingCartCourseIds.has(cId) && !enrolledCourseIdSet.has(cId)) {
          cart.items.push({
            course: course._id as Types.ObjectId,
            addedAt: new Date(),
          });
          existingCartCourseIds.add(cId);
        }
      }

      await cart.save();
    }

    await cart.populate({
      path: "items.course",
      select: "_id title price thumbnailUrl isPaid status isActive isApproved instructor",
      populate: { path: "instructor", select: "name" },
    });

    const formattedItems = formatCartItems(cart.items);
    return res.json({
      message: "Cart merged successfully",
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error in mergeCart:", error);
    return res.status(500).json({ message: "Failed to merge cart" });
  }
}
