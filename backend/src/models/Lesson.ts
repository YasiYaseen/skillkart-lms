import { Schema, model, type Document, type Types } from "mongoose";

export type LessonType = "video" | "article" | "quiz" | "assignment";

export interface ILesson extends Document {
  section: Types.ObjectId;
  title: string;
  type: LessonType;
  order: number;
  durationMinutes: number;
  isPreview: boolean;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    type: {
      type: String,
      enum: ["video", "article", "quiz", "assignment"],
      required: true,
      default: "video",
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

LessonSchema.index({ section: 1, order: 1 }, { unique: true });

export default model<ILesson>("Lesson", LessonSchema);
