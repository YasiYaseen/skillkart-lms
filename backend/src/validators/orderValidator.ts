import { z } from "zod";

export const checkoutSchema = z.object({
  courseIds: z.array(z.string().min(1)).min(1, "Cart must contain at least 1 course"),
  couponCode: z.string().trim().toUpperCase().optional().nullable(),
  paymentMethod: z
    .enum(["simulated", "free", "stripe", "razorpay", "paypal", "card", "express", "upi"])
    .default("simulated"),
  billingDetails: z
    .object({
      name: z.string().trim().optional().nullable(),
      email: z.string().trim().email("Invalid email address").optional().or(z.literal("")).nullable(),
      country: z.string().trim().optional().nullable(),
    })
    .optional(),
});
