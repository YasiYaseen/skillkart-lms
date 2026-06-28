import { Schema, model, type Document, type Types } from "mongoose";

export interface IReview extends Document {
  course: Types.ObjectId;
  student: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
  },
  { timestamps: true }
);

ReviewSchema.index({ course: 1, student: 1 }, { unique: true });
ReviewSchema.index({ course: 1, createdAt: -1 });

export default model<IReview>("Review", ReviewSchema);
