import type { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import User from "../models/User.js";
import type { AuthTokenPayload } from "../types/auth.js";

function getBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1] || null;
}

async function resolveUserFromToken(token: string): Promise<AuthTokenPayload | null> {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const decoded = verify(token, process.env.JWT_SECRET) as Partial<AuthTokenPayload> & {
    userId?: string;
  };

  const userId = decoded.id || decoded.userId;
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).select("_id role onboardingCompleted");
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    role: user.role,
    onboardingCompleted: Boolean(user.onboardingCompleted),
  };
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const payload = await resolveUserFromToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized: invalid token" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}

export async function optionalProtect(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    const payload = await resolveUserFromToken(token);
    if (payload) {
      req.user = payload;
    }

    return next();
  } catch {
    return next();
  }
}
