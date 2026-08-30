import { Schema, model, type Document, type Types } from "mongoose";

export interface IAnnouncement extends Document {
  course: Types.ObjectId;
  instructor: Types.ObjectId;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
  },
  { timestamps: true }
);

// Fast latest-first queries per course
AnnouncementSchema.index({ course: 1, createdAt: -1 });

export default model<IAnnouncement>("Announcement", AnnouncementSchema);
