import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().trim().min(3, "Coupon code must be at least 3 characters").max(20).toUpperCase(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1, "Discount value must be at least 1"),
  courseId: z.string().optional().nullable(),
  minPurchaseAmount: z.number().min(0).optional().default(0),
  maxDiscountAmount: z.number().min(1).optional().nullable(),
  maxRedemptions: z.number().min(1).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required").toUpperCase(),
  courseIds: z.array(z.string().min(1)).min(1, "At least one course is required in cart"),
});
