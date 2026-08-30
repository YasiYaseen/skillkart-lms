import { Schema, model, type Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  description: string;
  gradient?: string;
  tagQuery?: string;
  tags: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "📚",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    gradient: {
      type: String,
      default: "from-indigo-600/15 via-purple-600/10 to-indigo-900/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    },
    tagQuery: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CategorySchema.index({ order: 1, isActive: 1 });

export default model<ICategory>("Category", CategorySchema);
