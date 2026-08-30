import { Schema, model, type Document, type Types } from "mongoose";

export interface IBookmark extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

BookmarkSchema.index({ user: 1, lesson: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, course: 1, createdAt: -1 });

export default model<IBookmark>("Bookmark", BookmarkSchema);
