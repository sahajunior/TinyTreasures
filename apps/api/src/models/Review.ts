import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  orderItemIndex: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderItemIndex: { type: Number, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, order: 1, orderItemIndex: 1 }, { unique: true });

export default mongoose.model<IReview>("Review", reviewSchema);
