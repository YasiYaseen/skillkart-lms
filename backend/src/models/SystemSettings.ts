import { Schema, model, type Document } from "mongoose";

export interface ISystemSettings extends Document {
  isSingleton: boolean;
  // General & Branding
  platformName: string;
  supportEmail: string;
  tagline: string;
  primaryCurrency: string;
  // Financial & Commission
  platformCommissionRate: number;
  instructorPayoutShare: number;
  minPayoutThreshold: number;
  // Maintenance Mode
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEstimatedEndTime?: Date;
  // Access & Registration
  allowUserRegistration: boolean;
  requireInstructorApproval: boolean;
  requireEmailVerification: boolean;
  // Email Diagnostics
  smtpHost: string;
  smtpPort: number;
  smtpSenderEmail: string;
  smtpStatus: "operational" | "degraded" | "not_configured";
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
    platformName: {
      type: String,
      default: "SkillKart LMS",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "support@skillkart.com",
      trim: true,
    },
    tagline: {
      type: String,
      default: "Empower your career with top-rated interactive tech courses",
      trim: true,
    },
    primaryCurrency: {
      type: String,
      default: "USD",
      trim: true,
    },
    platformCommissionRate: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    instructorPayoutShare: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    minPayoutThreshold: {
      type: Number,
      default: 50,
      min: 1,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "SkillKart is currently undergoing scheduled platform upgrades. We will be right back!",
      trim: true,
    },
    maintenanceEstimatedEndTime: {
      type: Date,
    },
    allowUserRegistration: {
      type: Boolean,
      default: true,
    },
    requireInstructorApproval: {
      type: Boolean,
      default: true,
    },
    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    smtpHost: {
      type: String,
      default: "smtp.mailtrap.io",
      trim: true,
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpSenderEmail: {
      type: String,
      default: "notifications@skillkart.com",
      trim: true,
    },
    smtpStatus: {
      type: String,
      enum: ["operational", "degraded", "not_configured"],
      default: "operational",
    },
  },
  { timestamps: true }
);

export default model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
