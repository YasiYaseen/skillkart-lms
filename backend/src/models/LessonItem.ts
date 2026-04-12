import { Schema, model, type Document, type Types } from "mongoose";

export type LessonItemType = "video" | "text" | "pdf" | "link" | "code" | "quiz_block";

export interface ILessonItem extends Document {
  lesson: Types.ObjectId;
  type: LessonItemType;
  content: Record<string, unknown>;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonItemSchema = new Schema<ILessonItem>(
  {
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["video", "text", "pdf", "link", "code", "quiz_block"],
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

LessonItemSchema.index({ lesson: 1, order: 1 }, { unique: true });

export default model<ILessonItem>("LessonItem", LessonItemSchema);
