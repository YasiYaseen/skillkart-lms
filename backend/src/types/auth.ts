import type { Request } from "express";

export type UserRole = "student" | "instructor" | "admin";

export interface AuthTokenPayload {
  id: string;
  role: UserRole;
  onboardingCompleted: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}
