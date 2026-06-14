import Order from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { cacheDelete, cacheGet, cacheSet } from "./cache.service";
import mongoose from "mongoose";

export const getDashboard = async (sellerId: string) => {
  if (!mongoose.isValidObjectId(sellerId)) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const cacheKey = `seller:dashboard:${sellerId}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

  const orderStats = await Order.aggregate([
    { $unwind: "$items" },
    { $match: { "items.seller": sellerObjectId, paymentStatus: "paid" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$items.status", "pending"] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = orderStats[0] || { totalRevenue: 0, pendingCount: 0 };

  const topProducts = await Order.aggregate([
    { $unwind: "$items" },
    { $match: { "items.seller": sellerObjectId, paymentStatus: "paid" } },
    {
      $group: {
        _id: "$items.product",
        title: { $first: "$items.title" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        unitsSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const weeklyRevenue = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: {
        "items.seller": sellerObjectId,
        paymentStatus: "paid",
        createdAt: { $gte: eightWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: "$createdAt" },
          week: { $isoWeek: "$createdAt" },
        },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        week: "$_id.week",
        revenue: 1,
      },
    },
  ]);

  const result = {
    totalRevenue: stats.totalRevenue,
    pendingCount: stats.pendingCount,
    topProducts,
    weeklyRevenue,
  };

  await cacheSet(cacheKey, result, 120);
  return result;
};

export const getSellerOrders = async (sellerId: string) => {
  const orders = await Order.find({
    "items.seller": sellerId,
    paymentStatus: "paid",
  }).sort({ createdAt: -1 });

  return orders.map((order) => ({
    _id: order._id,
    buyer: order.buyer,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    items: order.items.flatMap((item, orderItemIndex) =>
      item.seller.toString() === sellerId
        ? [
            {
              product: item.product,
              seller: item.seller,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
              category: item.category,
              condition: item.condition,
              status: item.status,
              reviewLeft: item.reviewLeft,
              orderItemIndex,
            },
          ]
        : []
    ),
  }));
};

export const shipItem = async (
  sellerId: string,
  orderId: string,
  itemIndex: number
): Promise<void> => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }
  if (!Number.isInteger(itemIndex) || itemIndex < 0) {
    throw new ApiError(400, "Invalid order item index");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const item = order.items[itemIndex];
  if (!item) throw new ApiError(404, "Order item not found");
  if (item.seller.toString() !== sellerId) {
    throw new ApiError(403, "Forbidden");
  }
  if (item.status !== "pending") {
    throw new ApiError(409, `Cannot ship item with status ${item.status}`);
  }

  order.items[itemIndex].status = "shipped";
  await order.save();
  await cacheDelete(`seller:dashboard:${sellerId}`);
};
