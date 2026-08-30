import { z } from "zod";

export const rubricCriterionSchema = z.object({
  criterion: z.string().trim().min(1, "Criterion title is required"),
  maxPoints: z.number().min(1, "Max points must be at least 1"),
});

export const attachmentSchema = z.object({
  name: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  instructions: z.string().trim().optional().default(""),
  sectionId: z.string().optional(),
  rubric: z.array(rubricCriterionSchema).optional().default([]),
  maxScore: z.number().min(1).default(100),
  dueDate: z.string().datetime().optional().nullable(),
  attachments: z.array(attachmentSchema).optional().default([]),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submitAssignmentSchema = z.object({
  submissionType: z.enum(["file", "link", "text"]).default("file"),
  fileUrl: z.string().trim().optional(),
  fileName: z.string().trim().optional(),
  externalLink: z.string().trim().url().optional().or(z.literal("")),
  studentNote: z.string().trim().optional().default(""),
});

export const rubricScoreInputSchema = z.object({
  criterion: z.string().trim().min(1),
  pointsEarned: z.number().min(0),
});

export const gradeSubmissionSchema = z.object({
  score: z.number().min(0),
  status: z.enum(["under_review", "graded", "resubmission_requested"]).default("graded"),
  rubricScores: z.array(rubricScoreInputSchema).optional().default([]),
  instructorFeedback: z.string().trim().optional().default(""),
});
