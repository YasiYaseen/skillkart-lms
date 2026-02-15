import { Router } from "express";
import { register, login } from "../controllers/auth/authController.js";
import { googleLogin } from "../controllers/auth/googleAuthController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin); 

export default router;
