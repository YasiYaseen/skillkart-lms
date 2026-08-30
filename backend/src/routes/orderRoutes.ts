import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { checkout, getOrderHistory, getOrderReceipt } from "../controllers/orderController";

const router = Router();

// Student Protected Checkout & Order History
router.post("/checkout", protect, checkout);
router.get("/history", protect, getOrderHistory);
router.get("/:orderId/receipt", protect, getOrderReceipt);

export default router;
