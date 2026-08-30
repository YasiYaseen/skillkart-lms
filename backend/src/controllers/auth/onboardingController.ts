import type { Request, Response } from "express";
import User from "../../models/User";

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

    if (normalizedRole) {
      updateData.role = normalizedRole;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      message: "Onboarding complete",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
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
      "name email role onboardingCompleted headline bio interests socialLinks"
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
        onboardingCompleted: user.onboardingCompleted,
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
