import AuditLog from "../models/AuditLog";
import type { Request } from "express";

export interface LogAuditOptions {
  adminId: string;
  action: string;
  targetType: "user" | "course" | "enrollment" | "system";
  targetId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  req?: Request;
}

export async function recordAuditLog(options: LogAuditOptions): Promise<void> {
  try {
    const ipAddress =
      options.req?.ip ||
      (options.req?.headers["x-forwarded-for"] as string) ||
      options.req?.socket?.remoteAddress ||
      undefined;

    await AuditLog.create({
      admin: options.adminId,
      action: options.action,
      targetType: options.targetType,
      targetId: options.targetId,
      targetName: options.targetName,
      details: options.details || {},
      ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : undefined,
    });
  } catch (error) {
    console.error("[AUDIT] Failed to record audit log:", error);
  }
}
