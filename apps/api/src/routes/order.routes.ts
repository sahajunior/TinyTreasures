import { Router } from "express";
import auth from "../middleware/auth";
import requireRole from "../middleware/requireRole";
import * as orderController from "../controllers/order.controller";

const router = Router();

router.use(auth, requireRole("buyer"));

router.post("/checkout", orderController.checkout);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderById);

export default router;
