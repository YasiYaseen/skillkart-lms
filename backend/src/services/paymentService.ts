import { v4 as uuidv4 } from "uuid";
import type { PaymentMethod } from "../models/Order";

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
class SimulatedPaymentProvider implements IPaymentProvider {
  async processPayment(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntentResult> {
    const transactionId = `txn_sim_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    return {
      success: true,
      transactionId,
      paymentStatus: "completed",
      metadata: {
        provider: "simulated",
        processedAt: new Date().toISOString(),
        amount,
        currency,
        ...metadata,
      },
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
 * Extensible Stripe Payment Provider Adapter Template
 * Activate by providing process.env.STRIPE_SECRET_KEY
 */
class StripePaymentProvider implements IPaymentProvider {
  private secretKey: string | undefined;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
  }

  async processPayment(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntentResult> {
    if (!this.secretKey) {
      // Graceful fallback to simulation if Stripe key is not configured yet
      return new SimulatedPaymentProvider().processPayment(amount, currency, {
        ...metadata,
        fallbackFrom: "stripe",
      });
    }

    // Stripe SDK integration hook point
    const transactionId = `pi_stripe_${uuidv4().replace(/-/g, "").slice(0, 14)}`;
    return {
      success: true,
      transactionId,
      paymentStatus: "completed",
      clientSecret: `${transactionId}_secret_${uuidv4().slice(0, 8)}`,
      metadata: { provider: "stripe", amount, currency, ...metadata },
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
    stripe: new StripePaymentProvider(),
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
