import { Schema, model, type Document, type Types } from "mongoose";

export interface IOrderItem {
  course: Types.ObjectId;
  title: string;
  originalPrice: number;
  discountAmount: number;
  discountFundedBy?: "platform" | "instructor" | "none";
  finalPrice: number;
  instructorPayout?: number;
  platformFee?: number;
}

export type PaymentMethod = "simulated" | "free" | "stripe" | "razorpay" | "paypal" | "card" | "express" | "upi";
export type PaymentStatus = "completed" | "pending" | "failed" | "refunded";

export interface IOrder extends Document {
  orderNumber: string;
  student: Types.ObjectId;
  items: IOrderItem[];
  coupon?: Types.ObjectId;
  couponCode?: string;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string;
  paymentMetadata?: Record<string, any>;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountFundedBy: {
      type: String,
      enum: ["platform", "instructor", "none"],
      default: "none",
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    instructorPayout: {
      type: Number,
      min: 0,
    },
    platformFee: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: (v: IOrderItem[]) => v.length > 0,
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentMethod: {
      type: String,
      enum: ["simulated", "free", "stripe", "razorpay", "paypal", "card", "express", "upi"],
      default: "simulated",
    },
    paymentStatus: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed",
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    paymentMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default model<IOrder>("Order", OrderSchema);
