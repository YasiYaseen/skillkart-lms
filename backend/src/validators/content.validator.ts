import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "instructor"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Valid email address is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
  headline: z.string().trim().max(120, "Headline cannot exceed 120 characters").optional(),
  bio: z.string().trim().max(500, "Bio cannot exceed 500 characters").optional(),
  avatar: z.string().trim().min(1).optional().or(z.literal("")).nullable(),
  interests: z.array(z.string().trim().max(60)).optional(),
  socialLinks: z
    .object({
      website: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
      linkedin: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
      twitter: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
    })
    .optional(),
});

// ── Section ──────────────────────────────────────────────────────────────────
export const createSectionSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  order: z.number().int().min(1).optional(),
  isLocked: z.boolean().optional(),
  prerequisiteSectionId: z.string().optional(),
});

// ── Lesson ───────────────────────────────────────────────────────────────────
export const createLessonSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  type: z.enum(["video", "text", "quiz", "pdf", "link"]).optional(),
  order: z.number().int().min(1).optional(),
  durationMinutes: z.number().int().min(0).max(600).optional(),
  isPreview: z.boolean().optional(),
  isMandatory: z.boolean().optional(),
});

// ── Lesson Item ───────────────────────────────────────────────────────────────
export const createLessonItemSchema = z.object({
  type: z.enum(["video", "text", "pdf", "link", "code", "quiz_block"]),
  content: z.record(z.string(), z.unknown()).refine(
    (c) => Object.keys(c).length > 0,
    "content must not be empty"
  ),
  order: z.number().int().min(1).optional(),
});
