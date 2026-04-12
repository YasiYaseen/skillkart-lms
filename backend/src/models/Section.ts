import { Schema, model, type Document, type Types } from "mongoose";

export interface ISection extends Document {
  course: Types.ObjectId;
  title: string;
  order: number;
  isLocked: boolean;
  prerequisiteSection?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 140,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    prerequisiteSection: {
      type: Schema.Types.ObjectId,
      ref: "Section",
    },
  },
  { timestamps: true }
);

SectionSchema.index({ course: 1, order: 1 }, { unique: true });

export default model<ISection>("Section", SectionSchema);
