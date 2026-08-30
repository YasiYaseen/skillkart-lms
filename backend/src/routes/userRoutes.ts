import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getPublicInstructorProfile,
} from "../controllers/user/userController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.get("/instructor/:instructorId", getPublicInstructorProfile);

export default router;

