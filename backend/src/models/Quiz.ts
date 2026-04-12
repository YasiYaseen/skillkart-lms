import { Schema, model, type Document, type Types } from "mongoose";

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface IQuiz extends Document {
  lesson: Types.ObjectId;
  questions: IQuestion[];
  passingPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true, validate: (v: string[]) => v.length >= 2 },
    correctAnswer: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      unique: true,
      index: true,
    },
    questions: {
      type: [QuestionSchema],
      required: true,
      validate: (v: IQuestion[]) => v.length >= 1,
    },
    passingPercentage: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

export default model<IQuiz>("Quiz", QuizSchema);
