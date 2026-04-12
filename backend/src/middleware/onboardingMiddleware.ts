import type { NextFunction, Request, Response } from "express";

export function requireOnboardingCompleted(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.user.onboardingCompleted) {
    return res.status(403).json({ message: "Complete onboarding first" });
  }

  return next();
}
