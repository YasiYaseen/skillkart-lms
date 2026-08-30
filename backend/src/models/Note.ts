import { Schema, model, type Document, type Types } from "mongoose";

export interface INote extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
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
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

NoteSchema.index({ user: 1, lesson: 1, createdAt: -1 });
NoteSchema.index({ user: 1, course: 1, createdAt: -1 });

export default model<INote>("Note", NoteSchema);
