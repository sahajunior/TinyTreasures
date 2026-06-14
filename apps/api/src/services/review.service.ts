import Review from "../models/Review";
import Order from "../models/Order";
import Product from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { cacheInvalidate } from "./cache.service";
import mongoose from "mongoose";

interface ReviewInput {
  productId: string;
  orderId: string;
  orderItemIndex: number;
  rating: number;
  comment?: string;
}

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: number }).code === 11000;

export const createReview = async (
  buyerId: string,
  data: ReviewInput
) => {
  if (!mongoose.isValidObjectId(data.productId) || !mongoose.isValidObjectId(data.orderId)) {
    throw new ApiError(400, "Invalid product or order ID");
  }
  if (!Number.isInteger(data.orderItemIndex) || data.orderItemIndex < 0) {
    throw new ApiError(400, "Invalid order item index");
  }
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    throw new ApiError(400, "Rating must be an integer from 1 to 5");
  }
  if (data.comment !== undefined && typeof data.comment !== "string") {
    throw new ApiError(400, "Comment must be a string");
  }
  if (data.comment && data.comment.length > 500) {
    throw new ApiError(400, "Comment cannot exceed 500 characters");
  }

  const order = await Order.findOne({ _id: data.orderId, buyer: buyerId, paymentStatus: "paid" });
  if (!order) throw new ApiError(404, "Order not found");

  const item = order.items[data.orderItemIndex];
  if (!item) throw new ApiError(404, "Order item not found");
  if (item.product.toString() !== data.productId) {
    throw new ApiError(400, "Product does not match order item");
  }
  if (item.reviewLeft) {
    throw new ApiError(409, "Review already submitted for this item");
  }

  let review;
  try {
    review = await Review.create({
      product: data.productId,
      buyer: buyerId,
      order: data.orderId,
      orderItemIndex: data.orderItemIndex,
      rating: data.rating,
      comment: data.comment,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, "Review already submitted for this item");
    }
    throw err;
  }

  // Mark reviewLeft on order item
  order.items[data.orderItemIndex].reviewLeft = true;
  await order.save();

  // Recalculate product rating
  const stats = await Review.aggregate([
    { $match: { product: review.product } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(data.productId, {
      averageRating: Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
    await cacheInvalidate(`product:${data.productId}`);
    await cacheInvalidate("products:*");
  }

  return review;
};

export const getProductReviews = async (productId: string) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  return Review.find({ product: productId })
    .populate("buyer", "name")
    .sort({ createdAt: -1 });
};
