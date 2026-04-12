import { Schema, model, Document } from "mongoose";

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
  },
  { timestamps: true }
);

export default model<IUser>("User", UserSchema);
