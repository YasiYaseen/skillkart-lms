import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  checkout,
  getOrderHistory,
  getOrderReceipt,
  handlePaymentWebhook,
} from "../controllers/orderController";
import { verifyRazorpayPayment } from "../controllers/verifyRazorpayPayment";

const router = Router();

// Public Payment Gateway Webhooks (asynchronous confirmation)
router.post("/webhook", handlePaymentWebhook);
router.post("/payment-webhook", handlePaymentWebhook);

// Student Protected Checkout & Order History
router.post("/checkout", protect, checkout);
router.get("/history", protect, getOrderHistory);
router.get("/:orderId/receipt", protect, getOrderReceipt);

router.post("/razorpay/verify", protect, verifyRazorpayPayment);

export default router;
