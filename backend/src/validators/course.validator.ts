import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140, "Title cannot exceed 140 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  thumbnailUrl: z.string().url("Thumbnail must be a valid URL").optional().or(z.literal("")),
  category: z.string().optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  whatYouWillLearn: z.array(z.string().trim()).optional(),
  prerequisites: z.array(z.string().trim()).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  isPaid: z.boolean().optional(),
  price: z.number().min(0, "Price cannot be negative").nullable().optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});