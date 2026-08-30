import { z } from "zod";

export const generateCoursesSchema = z.object({
  instructor: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(70),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(6).optional().default("Password@123"),
    headline: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(500).optional(),
    avatar: z.string().url().optional().or(z.literal("")),
    interests: z.array(z.string()).optional(),
  }),
  selectedPresets: z.array(z.string()).optional(),
  courseOverrides: z
    .object({
      isPublished: z.boolean().optional(),
      isPaid: z.boolean().optional(),
    })
    .optional(),
  forceRegenerate: z.boolean().optional().default(false),
});

export type GenerateCoursesInput = z.infer<typeof generateCoursesSchema>;
