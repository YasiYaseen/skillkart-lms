import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import SystemSettings from "../models/SystemSettings";

/**
 * AUDIT-48: Site-wide maintenance mode mutation guard
 * Rejects non-GET write requests from non-admin users with 503 Service Unavailable
 * when maintenance mode is toggled on in SystemSettings.
 */
export async function ensureNotInMaintenance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Safe read-only HTTP methods are always permitted
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    // 2. Allow system settings public endpoints and admin endpoints
    const url = req.originalUrl || req.url || "";
    if (url.startsWith("/api/settings/public") || url.startsWith("/api/admin")) {
      return next();
    }

    // 3. Allow authentication endpoints (login) so administrators can sign in to manage platform
    if (url === "/api/auth/login" || url === "/api/auth/google") {
      return next();
    }

    // 4. Allow payment gateway webhook callbacks so in-flight settlements aren't dropped
    if (url.includes("/webhook") || url.includes("/payment-webhook")) {
      return next();
    }

    // 5. Check if authenticated user is admin
    if (req.user && "role" in req.user && req.user.role === "admin") {
      return next();
    }

    // 6. If req.user is not yet populated, verify Bearer JWT token to check admin role
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as { role?: string };
          if (decoded && decoded.role === "admin") {
            return next();
          }
        } catch {
          // Token invalid or expired; proceed to maintenance check
        }
      }
    }

    // 7. Check singleton SystemSettings
    const settings = await SystemSettings.findOne({ isSingleton: true })
      .select("maintenanceMode maintenanceMessage maintenanceEstimatedEndTime")
      .lean();

    if (settings?.maintenanceMode) {
      res.status(503).json({
        message:
          settings.maintenanceMessage ||
          "Platform is currently undergoing scheduled platform upgrades. We will be right back!",
        maintenanceEstimatedEndTime: settings.maintenanceEstimatedEndTime,
      });
      return;
    }

    return next();
  } catch (err) {
    console.error("Error in ensureNotInMaintenance middleware:", err);
    return next();
  }
}

// Alias for backwards compatibility
export const ensureNotMaintenance = ensureNotInMaintenance;
export default ensureNotInMaintenance;
