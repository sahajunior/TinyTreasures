import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: "Cars" | "Sports" | "Action Figures";
  subcategory?: string;
  condition: "Mint in Box" | "Near Mint" | "Good" | "Used";
  scale?: string;
  series?: string;
  images: string[];
  stock: number;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["Cars", "Sports", "Action Figures"],
      required: true,
      index: true,
    },
    subcategory: String,
    condition: {
      type: String,
      enum: ["Mint in Box", "Near Mint", "Good", "Used"],
      required: true,
    },
    scale: String,
    series: String,
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

export default mongoose.model<IProduct>("Product", productSchema);
