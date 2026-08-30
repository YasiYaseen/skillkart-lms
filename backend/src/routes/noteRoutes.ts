import { Router } from "express";
import { updateNote, deleteNote } from "../controllers/course/noteController";
import { protect } from "../middleware/authMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";

const router = Router();

router.patch("/:noteId", protect, requireOnboardingCompleted, updateNote);
router.delete("/:noteId", protect, requireOnboardingCompleted, deleteNote);

export default router;
