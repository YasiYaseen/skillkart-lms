import { z } from "zod";

export const addToWishlistSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
});
