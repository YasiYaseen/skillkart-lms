import { Schema, model, type Document, type Types } from "mongoose";

export interface ICartItem {
  course: Types.ObjectId;
  addedAt: Date;
}

export interface ICart extends Document {
  student: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export default model<ICart>("Cart", CartSchema);
