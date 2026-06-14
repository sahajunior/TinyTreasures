import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  condition: string;
  status: "pending" | "shipped" | "delivered";
  reviewLeft: boolean;
}

export interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  totalAmount: number;
  stripeSessionId: string;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: "" },
    category: { type: String, required: true },
    condition: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
    },
    reviewLeft: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: {
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    totalAmount: { type: Number, required: true },
    stripeSessionId: { type: String, required: true, unique: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
