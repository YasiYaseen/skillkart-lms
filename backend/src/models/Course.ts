import { Schema, model, type Document, type Types } from "mongoose";

export type CourseStatus = "draft" | "published" | "archived";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface ICourse extends Document {
  title: string;
  description: string;
  thumbnailUrl?: string;
  level: CourseLevel;
  isPaid: boolean;
  price: number | null;
  status: CourseStatus;
  publishedAt?: Date;
  instructor: Types.ObjectId;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
      default: "beginner",
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourseSchema.pre("save", function normalizePaidPricing() {
  if (this.isPaid && (this.price === null || this.price === undefined)) {
    this.invalidate("price", "price is required when isPaid is true");
  }
  if (!this.isPaid) {
    this.price = null;
  }
});

CourseSchema.index({ title: "text", description: "text" });
CourseSchema.index({ instructor: 1, status: 1 });

export default model<ICourse>("Course", CourseSchema);
