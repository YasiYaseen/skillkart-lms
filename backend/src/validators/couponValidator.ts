import { z } from "zod";

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(3, "Coupon code must be at least 3 characters").max(20, "Coupon code cannot exceed 20 characters").toUpperCase(),
    title: z.string().trim().max(100).optional().nullable(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(1, "Discount value must be at least 1"),
    scope: z.enum(["single_course", "instructor_all", "platform_global"]).optional(),
    isPublic: z.boolean().optional().default(false),
    courseId: z.string().optional().nullable(),
    minPurchaseAmount: z.number().min(0).optional().default(0),
    maxDiscountAmount: z.number().min(1).optional().nullable(),
    maxRedemptions: z.number().int().min(1, "Max redemptions must be at least 1").optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  })
  .refine(
    (data) => !(data.discountType === "percentage" && data.discountValue > 100),
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  );

export const updateCouponSchema = z
  .object({
    code: z.string().trim().min(3, "Coupon code must be at least 3 characters").max(20).toUpperCase().optional(),
    title: z.string().trim().max(100).optional().nullable(),
    discountType: z.enum(["percentage", "fixed"]).optional(),
    discountValue: z.number().min(1, "Discount value must be at least 1").optional(),
    scope: z.enum(["single_course", "instructor_all", "platform_global"]).optional(),
    isPublic: z.boolean().optional(),
    courseId: z.string().optional().nullable(),
    minPurchaseAmount: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(1).optional().nullable(),
    maxRedemptions: z.number().int().min(1).optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !(data.discountType === "percentage" && data.discountValue !== undefined && data.discountValue > 100),
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  );

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required").toUpperCase(),
  courseIds: z.array(z.string().min(1)).min(1, "At least one course is required in cart"),
});
