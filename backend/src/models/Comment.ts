import { Schema, model, type Document, type Types } from "mongoose";

export interface IComment extends Document {
  lesson: Types.ObjectId;
  course: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  parentComment?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

CommentSchema.index({ lesson: 1, createdAt: 1 });
CommentSchema.index({ lesson: 1, parentComment: 1 });

export default model<IComment>("Comment", CommentSchema);
