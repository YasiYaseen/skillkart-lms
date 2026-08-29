import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { requireOnboardingCompleted } from "../middleware/onboardingMiddleware";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
} from "../controllers/wishlist/wishlistController";

const router = Router();

router.use(protect, requireOnboardingCompleted);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:courseId", removeFromWishlist);
router.get("/check/:courseId", checkWishlistStatus);

export default router;
