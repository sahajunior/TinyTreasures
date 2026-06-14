import { NextFunction, Request, Response } from "express";
import * as reviewService from "../services/review.service";

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const review = await reviewService.createReview(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.id as string);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};
