import type { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../../models/User";
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
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId: sub,
        avatar: picture,
        password: "",
        onboardingCompleted: false,
      });
      isNewUser = true;
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
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    return res.status(401).json({ message: "Google authentication failed" });
  }
}
