import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(20),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  isPaid: z.boolean().optional(),
  price: z.number().nullable().optional(),
});