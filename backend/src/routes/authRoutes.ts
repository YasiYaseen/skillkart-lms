import { Router } from "express";
import { register, login } from "../controllers/auth/authController";
import { googleLogin } from "../controllers/auth/googleAuthController";
import {
  completeOnboarding,
  getOnboardingStatus,
} from "../controllers/auth/onboardingController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

router.get("/onboarding/status", protect, getOnboardingStatus);
router.post("/onboarding/complete", protect, completeOnboarding);

export default router;
