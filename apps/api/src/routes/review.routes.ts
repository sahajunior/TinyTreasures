import { Router } from "express";
import auth from "../middleware/auth";
import requireRole from "../middleware/requireRole";
import * as reviewController from "../controllers/review.controller";

const router = Router();

router.post("/", auth, requireRole("buyer"), reviewController.createReview);
router.get("/product/:id", reviewController.getProductReviews);

export default router;
