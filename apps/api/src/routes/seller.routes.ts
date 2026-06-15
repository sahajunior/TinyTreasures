import { Router } from "express";
import auth from "../middleware/auth";
import requireRole from "../middleware/requireRole";
import * as productController from "../controllers/product.controller";
import * as sellerController from "../controllers/seller.controller";
import { uploadProductImage, uploadProductImages } from "../middleware/upload";

const router = Router();

router.use(auth, requireRole("seller"));

router.get("/dashboard", sellerController.getDashboard);
router.get("/orders", sellerController.getOrders);
router.put(
  "/orders/:orderId/items/:itemIndex/ship",
  sellerController.shipItem
);
router.get("/products", productController.getSellerProducts);
router.get("/products/:id", productController.getSellerProduct);
router.post("/products", productController.createProduct);
router.put("/products/:id", productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);
router.post(
  "/products/:id/images",
  uploadProductImages,
  productController.uploadImages
);
router.patch("/products/:id/images/order", productController.reorderImages);
router.put(
  "/products/:id/images/:imageIndex",
  uploadProductImage,
  productController.replaceImage
);
router.delete(
  "/products/:id/images/:imageIndex",
  productController.deleteImage
);

export default router;
