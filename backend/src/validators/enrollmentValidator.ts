import { z } from "zod";

export const enrollSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
});

export const progressUpdateSchema = z.object({
  lessonId:  z.string().min(1, "lessonId is required"),
  completed: z.boolean(),
});

export const resumeUpdateSchema = z.object({
  lessonId: z.string().min(1, "lessonId is required"),
});

export const enrollmentListQuerySchema = z.object({
  status: z.enum(["active", "completed", "cancelled", "expired"]).optional(),
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(50).default(10),
});

export const studentsListQuerySchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});
