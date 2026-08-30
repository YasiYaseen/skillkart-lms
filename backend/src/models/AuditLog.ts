import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  admin: Types.ObjectId;
  action: string;
  targetType: "user" | "course" | "enrollment" | "system";
  targetId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["user", "course", "enrollment", "system"],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export default model<IAuditLog>("AuditLog", AuditLogSchema);
