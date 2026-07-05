import { Schema, model, type Document, type Types } from "mongoose";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["info", "success", "warning"], default: "info" },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<INotification>("Notification", NotificationSchema);
