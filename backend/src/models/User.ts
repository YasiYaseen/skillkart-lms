import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "student" | "instructor" | "admin";
  googleId?: string;
  avatar?: string;
  onboardingCompleted: boolean;
  bio?: string;
  headline?: string;
  interests?: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  activeDates: string[];
  recentlyViewedCourses: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    googleId: String,
    avatar: String,
    onboardingCompleted: { type: Boolean, default: false },
    bio: { type: String, maxlength: 500 },
    headline: { type: String, maxlength: 120 },
    interests: [{ type: String }],
    socialLinks: {
      website: String,
      linkedin: String,
      twitter: String,
    },
    isActive: { type: Boolean, default: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String },
    activeDates: { type: [String], default: [] },
    recentlyViewedCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

export default model<IUser>("User", UserSchema);
