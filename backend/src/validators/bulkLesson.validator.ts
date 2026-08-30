import { z } from "zod";

export const singleBulkLessonSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  type: z.enum(["video", "text", "quiz", "pdf", "link"]).default("video"),
  durationMinutes: z.number().int().min(0).max(600).default(10),
  isPreview: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
  order: z.number().int().min(1).optional(),
});

export const bulkLessonsSchema = z.object({
  lessons: z.array(singleBulkLessonSchema).min(1, "Must provide at least one lesson"),
});
