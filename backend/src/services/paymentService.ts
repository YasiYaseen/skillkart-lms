import { v4 as uuidv4 } from "uuid";
import type { PaymentMethod } from "../models/Order";
import { RazorpayPaymentProvider } from "./RazorpayPaymentProvider";

export interface PaymentIntentResult {
  success: boolean;
  transactionId: string;
  paymentStatus: "completed" | "pending" | "failed";
  clientSecret?: string;
  metadata?: Record<string, any>;
  message?: string;
}

export interface IPaymentProvider {
  processPayment(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntentResult>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refundPayment(transactionId: string, amount?: number): Promise<boolean>;
}

/**
 * Default Simulated Payment Provider for frictionless demo/testing
 */
export class SimulatedPaymentProvider implements IPaymentProvider {
  async processPayment(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntentResult> {
    const transactionId = `txn_sim_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const requestedStatus = metadata?.simulateStatus || metadata?.paymentStatus || "completed";
    const paymentStatus: "completed" | "pending" | "failed" =
      requestedStatus === "pending" || requestedStatus === "failed" ? requestedStatus : "completed";
    const success = paymentStatus !== "failed";

    return {
      success,
      transactionId,
      paymentStatus,
      metadata: {
        provider: "simulated",
        processedAt: new Date().toISOString(),
        amount,
        currency,
        ...metadata,
      },
      message:
        paymentStatus === "pending"
          ? "Payment authorization is pending gateway clearance."
          : paymentStatus === "failed"
          ? "Payment authorization declined by issuing bank."
          : undefined,
    };
  }

  async verifyPayment(_transactionId: string): Promise<boolean> {
    return true;
  }

  async refundPayment(_transactionId: string, _amount?: number): Promise<boolean> {
    return true;
  }
}


/**
 * Payment Service orchestrator
 */
export class PaymentService {
  private static providers: Record<string, IPaymentProvider> = {
    simulated: new SimulatedPaymentProvider(),
    free: new SimulatedPaymentProvider(),
    razorpay: new RazorpayPaymentProvider(),
  };

  public static getProvider(method: PaymentMethod): IPaymentProvider {
    return this.providers[method] || this.providers.simulated;
  }

  public static async executePayment(
    method: PaymentMethod,
    amount: number,
    currency: string = "USD",
    metadata?: Record<string, any>
  ): Promise<PaymentIntentResult> {
    if (amount === 0) {
      return this.providers.free.processPayment(0, currency, { ...metadata, isFreeOrder: true });
    }

    const provider = this.getProvider(method);
    return provider.processPayment(amount, currency, metadata);
  }
}
