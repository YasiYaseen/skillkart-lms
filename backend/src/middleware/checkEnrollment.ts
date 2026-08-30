import type { Request, Response, NextFunction } from "express";
import Enrollment from "../models/Enrollment";

export async function checkEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = req.params.courseId;
    if (!courseId) {
      return res.status(400).json({ message: "courseId param is required" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId,
    });

    if (!enrollment || (enrollment.status !== "active" && enrollment.status !== "completed")) {
      return res.status(403).json({
        message: "You must have an active or completed enrollment to access this content.",
      });
    }

    // Attach for downstream use if needed
    (req as any).enrollment = enrollment;
    next();
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
