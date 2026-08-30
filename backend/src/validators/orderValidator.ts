import { z } from "zod";

export const checkoutSchema = z.object({
  courseIds: z.array(z.string().min(1)).min(1, "Cart must contain at least 1 course"),
  couponCode: z.string().trim().toUpperCase().optional().nullable(),
  paymentMethod: z.enum(["simulated", "free", "stripe", "razorpay", "paypal"]).default("simulated"),
  billingDetails: z.object({
    name: z.string().trim().optional(),
    email: z.string().email().optional(),
    country: z.string().optional(),
  }).optional(),
});
