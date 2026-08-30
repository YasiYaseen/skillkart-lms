import { Schema, model, type Document, type Types } from "mongoose";

export type PayoutMethod = "bank_transfer" | "paypal" | "stripe";
export type PayoutStatus = "pending" | "processing" | "completed" | "rejected";

export interface IPayoutAccountDetails {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paypalEmail?: string;
  stripeAccountId?: string;
}

export interface IPayout extends Document {
  instructor: Types.ObjectId;
  amount: number;
  currency: string;
  method: PayoutMethod;
  accountDetails: IPayoutAccountDetails;
  status: PayoutStatus;
  referenceNumber: string;
  notes?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "USD",
    },
    method: {
      type: String,
      enum: ["bank_transfer", "paypal", "stripe"],
      required: true,
    },
    accountDetails: {
      bankName: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      routingNumber: { type: String, trim: true },
      paypalEmail: { type: String, trim: true },
      stripeAccountId: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default model<IPayout>("Payout", PayoutSchema);
