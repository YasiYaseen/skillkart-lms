import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  mergeCart,
} from "../controllers/cartController";

const router = Router();

// All cart endpoints require authentication
router.get("/", protect, getCart);
router.post("/items", protect, addToCart);
router.delete("/items/:courseId", protect, removeFromCart);
router.delete("/", protect, clearCart);
router.post("/merge", protect, mergeCart);

export default router;
