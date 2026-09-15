import { IPaymentProvider, PaymentIntentResult, SimulatedPaymentProvider } from "./paymentService";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid"

export class RazorpayPaymentProvider implements IPaymentProvider {
  private keyId: string | undefined;
  private keySecret: string | undefined;
  private instance: any = null;

  private getInstance(): any {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return null;
    }

    if (!this.instance || this.keyId !== keyId || this.keySecret !== keySecret) {
      this.keyId = keyId;
      this.keySecret = keySecret;
      this.instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }

    return this.instance;
  }

  async processPayment(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntentResult> {
    const instance = this.getInstance();

    // Graceful fallback to simulation if credentials are not yet configured
    if (!instance || !this.keyId) {
      console.warn("[RazorpayPaymentProvider] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured. Falling back to simulation.");
      return new SimulatedPaymentProvider().processPayment(amount, currency, {
        ...metadata,
        fallbackFrom: "razorpay",
      });
    }

    try {
      // Razorpay accepts amount in the smallest currency sub-unit (paise for INR, cents for USD)
      const amountInSubunits = Math.round(amount * 100);

      const options = {
        amount: amountInSubunits,
        currency: (currency || "INR").toUpperCase(),
        receipt: `rcpt_${uuidv4().replace(/-/g, "").slice(0, 14)}`,
        notes: {
          studentId: metadata?.studentId || "",
          courseCount: String(metadata?.courseCount || 1),
        },
      };

      const rzpOrder = await instance.orders.create(options);

      return {
        success: true,
        transactionId: rzpOrder.id, // Razorpay order id (e.g. order_XXXXX)
        paymentStatus: "pending",   // Must remain pending until client verifies or webhook clears
        clientSecret: rzpOrder.id,
        metadata: {
          provider: "razorpay",
          razorpayOrderId: rzpOrder.id,
          razorpayAmount: rzpOrder.amount,
          razorpayCurrency: rzpOrder.currency,
          keyId: this.keyId,
          ...metadata,
        },
        message: "Razorpay order initiated. Complete checkout in modal.",
      };
    } catch (error: any) {
      console.error("[RazorpayPaymentProvider] Order creation failed:", error);
      return {
        success: false,
        transactionId: "",
        paymentStatus: "failed",
        message: error?.error?.description || error?.message || "Failed to create Razorpay order",
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    const instance = this.getInstance();
    if (!instance) return true;
    try {
      const payment = await instance.payments.fetch(transactionId);
      return payment.status === "captured";
    } catch {
      return false;
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<boolean> {
    const instance = this.getInstance();
    if (!instance) return true;
    try {
      const refundOptions = amount ? { amount: Math.round(amount * 100) } : {};
      await instance.payments.refund(transactionId, refundOptions);
      return true;
    } catch {
      return false;
    }
  }
}