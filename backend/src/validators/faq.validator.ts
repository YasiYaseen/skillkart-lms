import { z } from "zod";

export const createFAQSchema = z.object({
  question: z.string().trim().min(3, "Question must be at least 3 characters").max(300),
  answer: z.string().trim().min(5, "Answer must be at least 5 characters").max(2000),
  order: z.number().int().min(0).optional(),
});

export const updateFAQSchema = z.object({
  question: z.string().trim().min(3).max(300).optional(),
  answer: z.string().trim().min(5).max(2000).optional(),
  order: z.number().int().min(0).optional(),
});
