import { Schema, model, type Document, type Types } from "mongoose";

export interface IRubricScore {
  criterion: string;
  pointsEarned: number;
}

export type SubmissionStatus = "submitted" | "under_review" | "graded" | "resubmission_requested";

export interface IAssignmentSubmission extends Document {
  assignment: Types.ObjectId;
  course: Types.ObjectId;
  student: Types.ObjectId;
  submissionType: "file" | "link" | "text";
  fileUrl?: string;
  fileName?: string;
  externalLink?: string;
  studentNote?: string;
  status: SubmissionStatus;
  score?: number;
  rubricScores: IRubricScore[];
  instructorFeedback?: string;
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RubricScoreSchema = new Schema<IRubricScore>(
  {
    criterion: { type: String, required: true },
    pointsEarned: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionType: {
      type: String,
      enum: ["file", "link", "text"],
      required: true,
      default: "file",
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    externalLink: {
      type: String,
      trim: true,
    },
    studentNote: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "graded", "resubmission_requested"],
      default: "submitted",
      index: true,
    },
    score: {
      type: Number,
      min: 0,
    },
    rubricScores: {
      type: [RubricScoreSchema],
      default: [],
    },
    instructorFeedback: {
      type: String,
      trim: true,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee one active submission record per assignment per student
AssignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default model<IAssignmentSubmission>("AssignmentSubmission", AssignmentSubmissionSchema);
