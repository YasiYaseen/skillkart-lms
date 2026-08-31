import { Schema, model, type Document, type Types } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  title?: string;
  creatorRole: "admin" | "instructor";
  scope: "single_course" | "instructor_all" | "platform_global";
  fundedBy: "platform" | "instructor";
  isPublic: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  course?: Types.ObjectId;
  instructor?: Types.ObjectId;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  maxRedemptions?: number;
  timesRedeemed: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    creatorRole: {
      type: String,
      enum: ["admin", "instructor"],
      default: "instructor",
      index: true,
    },
    scope: {
      type: String,
      enum: ["single_course", "instructor_all", "platform_global"],
      default: "instructor_all",
      index: true,
    },
    fundedBy: {
      type: String,
      enum: ["platform", "instructor"],
      default: "instructor",
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 1,
    },
    maxRedemptions: {
      type: Number,
      min: 1,
    },
    timesRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model<ICoupon>("Coupon", CouponSchema);
