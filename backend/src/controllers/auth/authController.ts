import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import User from "../../models/User";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../validators/content.validator";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../../services/emailService";

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { name, email, password, role } = parsed.data;
    const normalizedRole = role === "instructor" ? "instructor" : "student";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      onboardingCompleted: false,
    });

    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");

    const token = sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Failsafe welcome email
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error("[EMAIL] Failed to send welcome email:", err);
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled. Please contact support." });
    }

    const isMatch = await compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      user.password = await hash(String(newPassword), 10);
      await user.save();
      return res.json({ message: "Password set successfully" });
    }

    const isMatch = await compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = await hash(String(newPassword), 10);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return 200 to prevent email enumeration
      return res.json({
        message: "If that email is registered with SkillKart, a password reset link has been sent.",
      });
    }

    const resetToken = randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email non-blockingly
    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) => {
      console.error("[AUTH] Failed to send password reset email:", err);
    });

    return res.json({
      message: "If that email is registered with SkillKart, a password reset link has been sent.",
      // Include token in development mode for easier local testing
      ...(process.env.NODE_ENV !== "production" ? { resetToken } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error handling password reset" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { token, newPassword } = parsed.data;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    user.password = await hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password has been successfully reset. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error resetting password" });
  }
}


