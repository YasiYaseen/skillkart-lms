import { Schema, model, type Document, type Types } from "mongoose";

export interface IRubricCriterion {
  criterion: string;
  maxPoints: number;
}

export interface IAttachment {
  name: string;
  url: string;
}

export interface IAssignment extends Document {
  course: Types.ObjectId;
  section?: Types.ObjectId;
  title: string;
  description: string;
  instructions?: string;
  rubric: IRubricCriterion[];
  maxScore: number;
  dueDate?: Date;
  attachments: IAttachment[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RubricCriterionSchema = new Schema<IRubricCriterion>(
  {
    criterion: { type: String, required: true, trim: true },
    maxPoints: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: "Section",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
    },
    rubric: {
      type: [RubricCriterionSchema],
      default: [],
    },
    maxScore: {
      type: Number,
      default: 100,
      min: 1,
    },
    dueDate: {
      type: Date,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IAssignment>("Assignment", AssignmentSchema);
