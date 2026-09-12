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

    const formatted = certificates.map((cert) => ({
      ...cert,
      isRevoked: Boolean(cert.revokedAt),
      revocationReason: cert.revocationReason || null,
      isDisciplinaryRevocation: Boolean(cert.isDisciplinaryRevocation),
      isHeld: cert.heldUntil ? cert.heldUntil > new Date() : false,
      heldUntil: cert.heldUntil || null,
    }));

    return res.json({ certificates: formatted });
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

    // Guard 3: Certificate time-lock check.
    // If heldUntil is in the future, the certificate is not yet publicly verifiable.
    if (certificate.heldUntil && certificate.heldUntil > new Date()) {
      return res.status(423).json({
        message: "This certificate is pending its verification hold and is not yet publicly verifiable",
        heldUntil: certificate.heldUntil,
      });
    }

    const isRevoked = Boolean(certificate.revokedAt);

    return res.json({
      certificate: {
        ...certificate,
        isRevoked,
        revocationReason: certificate.revocationReason || null,
        isDisciplinaryRevocation: Boolean(certificate.isDisciplinaryRevocation),
      },
      isRevoked,
      revokedAt: certificate.revokedAt || null,
      revocationReason: certificate.revocationReason || null,
      isDisciplinaryRevocation: Boolean(certificate.isDisciplinaryRevocation),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/certificates/claim
 * Student claims a certificate for a completed course.
 * Auto-generates if not yet issued; returns existing if already issued; clears revocation if legitimately re-completed.
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
      if (existing.revokedAt) {
        // AUDIT-110: Guard against claiming administratively or disciplinarily revoked certificates
        if (existing.isDisciplinaryRevocation) {
          return res.status(403).json({
            message: "This certificate was administratively revoked for disciplinary reasons and cannot be claimed or re-issued.",
            revocationReason: existing.revocationReason,
          });
        }

        // AUDIT-98: Certificate was previously revoked due to cancellation, but student has legitimately completed the course again.
        // Clear revocation, update issuance timestamp & enrollment reference.
        await Certificate.updateOne(
          { _id: existing._id },
          {
            $unset: { revokedAt: 1, revocationReason: 1, isDisciplinaryRevocation: 1, revokedBy: 1 },
            $set: {
              issuedAt: enrollment.completedAt || new Date(),
              enrollment: enrollment._id,
            },
          }
        );
        existing.revokedAt = undefined;
        existing.revocationReason = undefined;
        existing.isDisciplinaryRevocation = undefined;
        existing.revokedBy = undefined;
        existing.issuedAt = enrollment.completedAt || new Date();
        existing.enrollment = enrollment._id;

        // Send certificate email on re-issuance
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
                existing.certificateId
              ).catch((err) => {
                console.error("[EMAIL] Failed to send certificate email:", err);
              });
            }
          })
          .catch((err) => {
            console.error("[EMAIL] Error looking up certificate details for email:", err);
          });

        return res.status(200).json({
          certificate: existing,
          message: "Certificate re-issued successfully",
        });
      }

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
