import crypto from "crypto";
import { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import Order from "../models/Order";
import { activateOrderEnrollments } from "./orderController";

export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required Razorpay verification fields" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Razorpay secret key is not configured on server" });
    }
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature. Payment verification failed." });
    }

    let order = null;
    if (isValidObjectId(orderId)) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (!order && razorpay_order_id) {
      order = await Order.findOne({ transactionId: razorpay_order_id });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const studentIdStr =
      order.student && typeof order.student === "object" && "_id" in order.student
        ? String(order.student._id)
        : String(order.student || "");

    if (studentIdStr !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied to this order" });
    }

    // Idempotency: If already completed by webhook, return safely without duplicate notifications
    if (order.paymentStatus === "completed" || (order.paymentStatus as string) === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified and courses enrolled!",
        order,
      });
    }

    // Store payment transaction reference and metadata
    order.transactionId = razorpay_payment_id;
    order.paymentMetadata = {
      ...(order.paymentMetadata || {}),
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      verifiedAt: new Date().toISOString(),
    };
    await order.save();

    // activateOrderEnrollments transitions status to completed, increments coupon usage, and activates enrollments
    await activateOrderEnrollments(order);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and courses enrolled!",
      order,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return res.status(500).json({ message: "Server error verifying payment" });
  }
}