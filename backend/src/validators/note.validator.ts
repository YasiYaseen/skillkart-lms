import { z } from "zod";

export const noteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Note content cannot be empty")
    .max(5000, "Note cannot exceed 5000 characters"),
});

export const updateNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Note content cannot be empty")
    .max(5000, "Note cannot exceed 5000 characters"),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
