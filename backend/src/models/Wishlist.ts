import { Schema, model, type Document, type Types } from "mongoose";

export interface IWishlist extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    student: {
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
  },
  { timestamps: true }
);

WishlistSchema.index({ student: 1, course: 1 }, { unique: true });

export default model<IWishlist>("Wishlist", WishlistSchema);
