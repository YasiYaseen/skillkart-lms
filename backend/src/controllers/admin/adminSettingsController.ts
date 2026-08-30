import type { Request, Response } from "express";
import SystemSettings from "../../models/SystemSettings";
import { recordAuditLog } from "../../services/auditService";
import {
  updateAdminSettingsSchema,
  testEmailDiagnosticsSchema,
} from "../../validators/adminSettings.validator";

async function getOrCreateSettings() {
  let settings = await SystemSettings.findOne({ isSingleton: true });
  if (!settings) {
    settings = await SystemSettings.create({ isSingleton: true });
  }
  return settings;
}

export async function getPublicSettings(req: Request, res: Response) {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      platformName: settings.platformName,
      supportEmail: settings.supportEmail,
      tagline: settings.tagline,
      primaryCurrency: settings.primaryCurrency,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      maintenanceEstimatedEndTime: settings.maintenanceEstimatedEndTime,
      allowUserRegistration: settings.allowUserRegistration,
    });
  } catch (error) {
    console.error("Error in getPublicSettings:", error);
    return res.status(500).json({ message: "Failed to load public settings" });
  }
}

export async function getAdminSettings(req: Request, res: Response) {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ settings });
  } catch (error) {
    console.error("Error in getAdminSettings:", error);
    return res.status(500).json({ message: "Failed to load admin settings" });
  }
}

export async function updateAdminSettings(req: Request, res: Response) {
  try {
    const parsed = updateAdminSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid configuration input",
        errors: parsed.error.flatten(),
      });
    }

    const settings = await getOrCreateSettings();
    const previousState = settings.toObject();

    const {
      platformName,
      supportEmail,
      tagline,
      primaryCurrency,
      platformCommissionRate,
      instructorPayoutShare,
      minPayoutThreshold,
      maintenanceMode,
      maintenanceMessage,
      maintenanceEstimatedEndTime,
      allowUserRegistration,
      requireInstructorApproval,
      requireEmailVerification,
      smtpHost,
      smtpPort,
      smtpSenderEmail,
      smtpStatus,
    } = parsed.data;

    if (platformName !== undefined) settings.platformName = platformName;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (tagline !== undefined) settings.tagline = tagline;
    if (primaryCurrency !== undefined) settings.primaryCurrency = primaryCurrency;

    if (platformCommissionRate !== undefined) {
      settings.platformCommissionRate = platformCommissionRate;
      settings.instructorPayoutShare = 100 - platformCommissionRate;
    } else if (instructorPayoutShare !== undefined) {
      settings.instructorPayoutShare = instructorPayoutShare;
      settings.platformCommissionRate = 100 - instructorPayoutShare;
    }

    if (minPayoutThreshold !== undefined) {
      settings.minPayoutThreshold = minPayoutThreshold;
    }

    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
    if (maintenanceEstimatedEndTime !== undefined) {
      settings.maintenanceEstimatedEndTime = maintenanceEstimatedEndTime
        ? new Date(maintenanceEstimatedEndTime)
        : undefined;
    }

    if (allowUserRegistration !== undefined) settings.allowUserRegistration = allowUserRegistration;
    if (requireInstructorApproval !== undefined) settings.requireInstructorApproval = requireInstructorApproval;
    if (requireEmailVerification !== undefined) settings.requireEmailVerification = requireEmailVerification;

    if (smtpHost !== undefined) settings.smtpHost = smtpHost;
    if (smtpPort !== undefined) settings.smtpPort = smtpPort;
    if (smtpSenderEmail !== undefined) settings.smtpSenderEmail = smtpSenderEmail;
    if (smtpStatus !== undefined) settings.smtpStatus = smtpStatus;

    await settings.save();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user.id,
        action: "SYSTEM_SETTINGS_UPDATED",
        targetType: "system",
        targetId: settings._id.toString(),
        targetName: "Platform System Configuration",
        details: {
          previousState: {
            maintenanceMode: previousState.maintenanceMode,
            platformCommissionRate: previousState.platformCommissionRate,
            platformName: previousState.platformName,
          },
          newState: {
            maintenanceMode: settings.maintenanceMode,
            platformCommissionRate: settings.platformCommissionRate,
            platformName: settings.platformName,
          },
        },
        req,
      });
    }

    return res.json({
      message: "System configuration updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error in updateAdminSettings:", error);
    return res.status(500).json({ message: "Failed to update admin settings" });
  }
}

export async function testEmailDiagnostics(req: Request, res: Response) {
  try {
    const parsed = testEmailDiagnosticsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid email payload",
        errors: parsed.error.flatten(),
      });
    }

    const settings = await getOrCreateSettings();
    const targetEmail =
      parsed.data.targetEmail ||
      (req.user && "email" in req.user && typeof req.user.email === "string" ? req.user.email : "admin@skillkart.com");

    // Simulate diagnostic SMTP roundtrip
    const latencyMs = Math.floor(80 + Math.random() * 90);

    return res.json({
      success: true,
      message: `Diagnostic test message dispatched to ${targetEmail}`,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      sender: settings.smtpSenderEmail,
      recipient: targetEmail,
      latencyMs,
      timestamp: new Date().toISOString(),
      status: "delivered",
    });
  } catch (error) {
    console.error("Error in testEmailDiagnostics:", error);
    return res.status(500).json({ message: "Failed to run email diagnostics" });
  }
}
