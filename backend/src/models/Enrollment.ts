import { Schema, model, type Document, type Types } from "mongoose";

export type EnrollmentStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "pending_payment";

export type PaymentStatus = "none" | "pending" | "paid" | "failed";

export interface IEnrollment extends Document {
  student: Types.ObjectId;         // field name kept for BC; semantically = userId
  course: Types.ObjectId;          // field name kept for BC; semantically = courseId
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  completedLessonIds: Types.ObjectId[];
  totalLessonsCount: number;
  lastAccessedLessonId?: Types.ObjectId;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course:  { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired", "pending_payment"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    expiresAt: { type: Date },
    completedLessonIds: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    totalLessonsCount: { type: Number, default: 0 },
    lastAccessedLessonId: { type: Schema.Types.ObjectId, ref: "Lesson" },
    paymentStatus: {
      type: String,
      enum: ["none", "pending", "paid", "failed"],
      default: "none",
    },
    paymentId: { type: String },
  },
  { timestamps: true }
);

// Unique compound index
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Virtuals — never stored, always computed
EnrollmentSchema.virtual("completedLessonsCount").get(function () {
  return this.completedLessonIds.length;
});
EnrollmentSchema.virtual("progressPercentage").get(function () {
  if (this.totalLessonsCount === 0) return 0;
  return Math.round((this.completedLessonIds.length / this.totalLessonsCount) * 100);
});

export default model<IEnrollment>("Enrollment", EnrollmentSchema);
