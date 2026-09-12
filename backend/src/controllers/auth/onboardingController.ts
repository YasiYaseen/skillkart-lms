import type { Request, Response } from "express";
import User from "../../models/User";
import SystemSettings from "../../models/SystemSettings";

function normalizeText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLen);
}

export async function completeOnboarding(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { role, headline, bio, interests, socialLinks } = req.body;

    const normalizedHeadline = normalizeText(headline, 120);
    if (normalizedHeadline.length < 3) {
      return res.status(400).json({ message: "Headline must be at least 3 characters" });
    }

    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ message: "Select at least one interest" });
    }

    const normalizedInterests = Array.from(
      new Set(
        interests
          .map((item: unknown) => normalizeText(item, 60))
          .filter(Boolean)
          .slice(0, 10)
      )
    );
    if (normalizedInterests.length === 0) {
      return res.status(400).json({ message: "Select at least one valid interest" });
    }

    const allowedRoles = ["student", "instructor"];
    const normalizedRole = allowedRoles.includes(role) ? role : undefined;

    const updateData: Record<string, unknown> = {
      onboardingCompleted: true,
      headline: normalizedHeadline,
      bio: normalizeText(bio, 500),
      interests: normalizedInterests,
      socialLinks: {
        website: normalizeText(socialLinks?.website, 200),
        linkedin: normalizeText(socialLinks?.linkedin, 200),
        twitter: normalizeText(socialLinks?.twitter, 200),
      },
    };

    let requiresApproval = false;
    let message = "Onboarding complete";

    if (normalizedRole) {
      if (normalizedRole === "instructor") {
        // AUDIT-71: Respect requireInstructorApproval setting
        const settings = await SystemSettings.findOne({ isSingleton: true }).lean();
        const requireApproval = settings?.requireInstructorApproval ?? true;
        if (requireApproval) {
          // If the user was already an instructor or admin, preserve existing role
          if (req.user.role !== "instructor" && req.user.role !== "admin") {
            updateData.role = "student";
          }
          updateData.instructorStatus = "pending";
          updateData.isInstructorApproved = false;
          requiresApproval = true;
          message =
            "Onboarding complete. Teaching on SkillKart requires administrator review. Your application has been submitted.";

          // Populate initial application dossier so admin queue has actionable info
          updateData.instructorApplication = {
            teachingExperience: "online",
            primaryTopic: normalizedHeadline,
            experienceDetails:
              normalizeText(bio, 1000) ||
              `Applied during onboarding with focus on ${normalizedHeadline}`,
            linkedinUrl: normalizeText(socialLinks?.linkedin, 200) || undefined,
            sampleVideoOrPortfolioUrl: normalizeText(socialLinks?.website, 200) || undefined,
            appliedAt: new Date(),
          };
        } else {
          updateData.role = "instructor";
          updateData.instructorStatus = "approved";
          updateData.isInstructorApproved = true;
          message = "Onboarding complete. Instructor privileges granted!";
        }
      } else {
        if (req.user.role !== "admin") {
          updateData.role = normalizedRole;
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      message,
      requiresApproval,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        instructorStatus: user.instructorStatus,
        isInstructorApproved: user.isInstructorApproved,
        instructorApplication: user.instructorApplication,
        headline: user.headline,
        bio: user.bio,
        interests: user.interests,
        socialLinks: user.socialLinks,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getOnboardingStatus(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.id).select(
      "name email role isInstructorApproved instructorStatus instructorRejectionReason instructorApplication onboardingCompleted headline bio interests socialLinks avatar isActive"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      onboardingCompleted: user.onboardingCompleted,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isInstructorApproved: user.isInstructorApproved,
        instructorStatus: user.instructorStatus,
        instructorRejectionReason: user.instructorRejectionReason,
        instructorApplication: user.instructorApplication,
        onboardingCompleted: user.onboardingCompleted,
        headline: user.headline,
        bio: user.bio,
        interests: user.interests,
        socialLinks: user.socialLinks,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
