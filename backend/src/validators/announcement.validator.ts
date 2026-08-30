import { z } from "zod";

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(140, "Title must be at most 140 characters"),
  body: z
    .string()
    .trim()
    .min(10, "Body must be at least 10 characters"),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
