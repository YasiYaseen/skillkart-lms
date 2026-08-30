import { z } from "zod";

export const updateAdminSettingsSchema = z.object({
  platformName: z.string().trim().min(2).max(100).optional(),
  supportEmail: z.string().trim().email().optional(),
  tagline: z.string().trim().max(250).optional(),
  primaryCurrency: z.string().trim().min(2).max(10).optional(),
  platformCommissionRate: z.number().min(0).max(100).optional(),
  instructorPayoutShare: z.number().min(0).max(100).optional(),
  minPayoutThreshold: z.number().min(1).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(500).optional(),
  maintenanceEstimatedEndTime: z.string().datetime().nullable().optional().or(z.literal("")),
  allowUserRegistration: z.boolean().optional(),
  requireInstructorApproval: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  smtpHost: z.string().trim().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSenderEmail: z.string().trim().email().optional(),
  smtpStatus: z.enum(["operational", "degraded", "not_configured"]).optional(),
});

export const testEmailDiagnosticsSchema = z.object({
  targetEmail: z.string().trim().email().optional(),
});
