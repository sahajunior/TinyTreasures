import { Request, Response, NextFunction } from "express";
import * as orderService from "../services/order.service";

export const checkout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cart, shippingAddress } = req.body;

    if (!cart || !shippingAddress) {
      res.status(400).json({ success: false, message: "Cart and shipping address required" });
      return;
    }

    const checkoutUrl = await orderService.createCheckoutSession(
      req.user!.userId,
      cart,
      shippingAddress
    );

    res.json({ success: true, data: { checkoutUrl } });
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
    const sessionId = req.query.sessionId as string | undefined;
    const orders = await orderService.getOrders(req.user!.userId, sessionId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await orderService.getOrderById(
      req.params.id as string,
      req.user!.userId
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
