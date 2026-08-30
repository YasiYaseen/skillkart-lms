import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Certificate from "../../models/Certificate";
import Enrollment from "../../models/Enrollment";
import Course from "../../models/Course";
import User from "../../models/User";
import { sendCertificateEmail } from "../../services/emailService";

/**
 * GET /api/certificates/me
 * Returns all certificates for the logged-in student.
 */
export async function getMyCertificates(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const certificates = await Certificate.find({ student: req.user.id })
      .populate("course", "title thumbnailUrl instructor")
      .populate({ path: "course", populate: { path: "instructor", select: "name" } })
      .sort({ issuedAt: -1 })
      .lean();

    return res.json({ certificates });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/certificates/:certificateId
 * Public endpoint — verifies a certificate by its unique ID.
 */
export async function getCertificateById(req: Request, res: Response) {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate("student", "name")
      .populate({
        path: "course",
        select: "title thumbnailUrl instructor",
        populate: { path: "instructor", select: "name" },
      })
      .lean();

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    return res.json({ certificate });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/certificates/claim
 * Student claims a certificate for a completed course.
 * Auto-generates if not yet issued; returns existing if already issued.
 */
export async function claimCertificate(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { courseId } = req.body;
    if (!courseId || !isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Valid courseId is required" });
    }

    // Check enrollment is completed
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId,
      status: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "You must complete the course before claiming a certificate",
      });
    }

    // Return existing or create new
    const existing = await Certificate.findOne({
      student: req.user.id,
      course: courseId,
    });

    if (existing) {
      return res.json({ certificate: existing, message: "Certificate already issued" });
    }

    const certificate = await Certificate.create({
      student: req.user.id,
      course: courseId,
      enrollment: enrollment._id,
      issuedAt: enrollment.completedAt || new Date(),
    });

    // Failsafe certificate email
    Promise.all([
      User.findById(req.user.id).select("email name").lean(),
      Course.findById(courseId).select("title").lean(),
    ])
      .then(([studentUser, courseDoc]) => {
        if (studentUser && studentUser.email && courseDoc) {
          sendCertificateEmail(
            studentUser.email,
            studentUser.name || "Student",
            courseDoc.title,
            certificate.certificateId
          ).catch((err) => {
            console.error("[EMAIL] Failed to send certificate email:", err);
          });
        }
      })
      .catch((err) => {
        console.error("[EMAIL] Error looking up certificate details for email:", err);
      });

    return res.status(201).json({ certificate, message: "Certificate issued successfully" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
