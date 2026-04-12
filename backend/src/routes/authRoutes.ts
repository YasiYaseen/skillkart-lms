import { Router } from "express";
import { register, login } from "../controllers/auth/authController.js";
import { googleLogin } from "../controllers/auth/googleAuthController.js";
import {
  completeOnboarding,
  getOnboardingStatus,
} from "../controllers/auth/onboardingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

router.get("/onboarding/status", protect, getOnboardingStatus);
router.post("/onboarding/complete", protect, completeOnboarding);

export default router;
