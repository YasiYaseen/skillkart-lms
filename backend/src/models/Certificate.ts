import { Schema, model, type Document, type Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICertificate extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  enrollment: Types.ObjectId;
  certificateId: string; // human-readable unique ID for verification
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase(),
    },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One certificate per student per course
CertificateSchema.index({ student: 1, course: 1 }, { unique: true });

export default model<ICertificate>("Certificate", CertificateSchema);
