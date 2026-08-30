import type { AuthTokenPayload } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      enrollment?: import("../models/Enrollment").IEnrollment;
    }
  }
}

export {};
