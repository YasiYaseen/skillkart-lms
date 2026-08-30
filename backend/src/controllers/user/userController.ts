import type { Request, Response } from "express";
import User from "../../models/User";

export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { name, bio, headline, avatar, interests, socialLinks } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      user.name = trimmedName;
    }

    if (headline !== undefined) user.headline = String(headline).trim().slice(0, 120);
    if (bio !== undefined) user.bio = String(bio).trim().slice(0, 500);
    if (avatar !== undefined) user.avatar = String(avatar).trim();
    if (Array.isArray(interests)) user.interests = interests.map(i => String(i).trim());
    if (socialLinks && typeof socialLinks === "object") {
      user.socialLinks = {
        website: socialLinks.website ? String(socialLinks.website).trim() : undefined,
        linkedin: socialLinks.linkedin ? String(socialLinks.linkedin).trim() : undefined,
        twitter: socialLinks.twitter ? String(socialLinks.twitter).trim() : undefined,
      };
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        headline: user.headline,
        bio: user.bio,
        interests: user.interests,
        socialLinks: user.socialLinks,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
