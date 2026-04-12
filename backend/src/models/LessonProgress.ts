import { Schema, model, type Document, type Types } from "mongoose";

export interface ILessonProgress extends Document {
  user: Types.ObjectId;
  lesson: Types.ObjectId;
  completed: boolean;
  progressPercentage: number;
  lastWatchedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastWatchedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

LessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

export default model<ILessonProgress>("LessonProgress", LessonProgressSchema);
