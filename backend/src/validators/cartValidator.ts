import { z } from "zod";

export const addToCartSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export const mergeCartSchema = z.object({
  courseIds: z.array(z.string()).default([]),
});
