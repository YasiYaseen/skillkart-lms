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

    const { name, bio } = req.body; // Add any other fields we want to allow updating

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    // We can extend the schema to support bio/avatar later, for MVP name is fine

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
