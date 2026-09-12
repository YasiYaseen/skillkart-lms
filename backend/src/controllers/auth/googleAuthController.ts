import type { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../../models/User";
import SystemSettings from "../../models/SystemSettings";
import { sendWelcomeEmail } from "../../services/emailService";

export async function googleLogin(req: Request, res: Response) {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ message: "Access token required" });
  }

  try {
    const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { email, name, picture, sub } = googleRes.data;

    let isNewUser = false;
    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });
    if (!user) {
      const settings = await SystemSettings.findOne({ isSingleton: true });
      if (settings && settings.allowUserRegistration === false) {
        return res.status(403).json({
          message: "User registration is currently disabled by the platform administrator.",
        });
      }

      user = await User.create({
        email,
        name,
        googleId: sub,
        avatar: picture,
        password: "",
        role: "student",
        isInstructorApproved: true,
        instructorStatus: "none",
        onboardingCompleted: false,
      });
      isNewUser = true;
    } else {
      // AUDIT-105: Guard against suspended/deactivated accounts obtaining an active session
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      let needsSave = false;
      if (!user.googleId && sub) {
        user.googleId = sub;
        needsSave = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch((err) => {
        console.error("[EMAIL] Failed to send Google welcome email:", err);
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isInstructorApproved: user.isInstructorApproved,
        instructorStatus: user.instructorStatus,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return res.status(401).json({ message: "Google authentication failed" });
    }
    console.error("[GOOGLE_AUTH] Error during Google login:", error);
    return res.status(500).json({ message: "Server error during Google authentication" });
  }
}
