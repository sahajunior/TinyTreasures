import { NextFunction, Request, Response } from "express";
import * as sellerService from "../services/seller.service";
import { ApiError } from "../utils/ApiError";

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dashboard = await sellerService.getDashboard(req.user!.userId);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await sellerService.getSellerOrders(req.user!.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

export const shipItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const itemIndex = Number(req.params.itemIndex);
    if (!Number.isInteger(itemIndex) || itemIndex < 0) {
      throw new ApiError(400, "Invalid order item index");
    }

    await sellerService.shipItem(
      req.user!.userId,
      req.params.orderId as string,
      itemIndex
    );
    res.json({ success: true, message: "Item marked as shipped" });
  } catch (err) {
    next(err);
  }
};
