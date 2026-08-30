import { Schema, model, Document, Types } from "mongoose";

export interface ICourseFAQ extends Document {
  course: Types.ObjectId;
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseFAQSchema = new Schema<ICourseFAQ>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CourseFAQSchema.index({ course: 1, order: 1 });

export default model<ICourseFAQ>("CourseFAQ", CourseFAQSchema);
