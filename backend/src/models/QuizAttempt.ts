import { Schema, model, type Document, type Types } from "mongoose";

export interface IQuizAttempt extends Document {
  user: Types.ObjectId;
  lesson: Types.ObjectId;
  answers: number[];
  score: number;
  passed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
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
    answers: {
      type: [Number],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
