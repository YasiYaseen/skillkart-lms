import { z } from "zod";

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Comment must be at least 2 characters")
    .max(2000, "Comment cannot exceed 2000 characters"),
  parentCommentId: z.string().optional().nullable(),
});

export type CommentInput = z.infer<typeof commentSchema>;
