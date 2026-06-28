import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/user/userController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

export default router;
