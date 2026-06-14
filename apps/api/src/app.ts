import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import sellerRoutes from "./routes/seller.routes";
import orderRoutes from "./routes/order.routes";
import webhookRoutes from "./routes/webhook.routes";
import reviewRoutes from "./routes/review.routes";
import rateLimiter from "./middleware/rateLimiter";
import errorHandler from "./middleware/errorHandler";
import { ApiError } from "./utils/ApiError";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new ApiError(403, "Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// Webhook route MUST come before express.json() — needs raw body for signature verification
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "TinyTreasures API running" });
});

app.use(
  "/api/auth",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, prefix: "rl:auth" }),
  authRoutes
);
app.use("/api/products", productRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(errorHandler);

export default app;
