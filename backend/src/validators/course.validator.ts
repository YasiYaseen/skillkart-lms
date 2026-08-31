import { z } from "zod";

const baseCourseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140, "Title cannot exceed 140 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  thumbnailUrl: z.string().trim().min(1).optional().or(z.literal("")).nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  whatYouWillLearn: z.array(z.string().trim()).optional(),
  prerequisites: z.array(z.string().trim()).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  isPaid: z.boolean().optional(),
  price: z.number().min(0, "Price cannot be negative").nullable().optional(),
});

export const createCourseSchema = baseCourseSchema.refine(
  (data) => !data.isPaid || (typeof data.price === "number" && data.price > 0),
  {
    message: "Valid price greater than 0 is required for paid courses",
    path: ["price"],
  }
);

export const updateCourseSchema = baseCourseSchema
  .partial()
  .extend({
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
  .refine(
    (data) => !data.isPaid || data.price === undefined || (typeof data.price === "number" && data.price > 0),
    {
      message: "Valid price greater than 0 is required for paid courses",
      path: ["price"],
    }
  );