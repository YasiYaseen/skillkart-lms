import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";
import {
  getMyCertificates,
  getCertificateById,
  claimCertificate,
} from "../controllers/certificate/certificateController";

const router = Router();

// Public — verify any certificate by its unique ID
router.get("/verify/:certificateId", getCertificateById);

// Protected — student actions
router.get("/me", protect, requireOnboardingCompleted, getMyCertificates);
router.post("/claim", protect, requireOnboardingCompleted, claimCertificate);

export default router;
