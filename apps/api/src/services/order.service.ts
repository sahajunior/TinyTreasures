import { stripe } from "../config/stripe";
import redis from "../config/redis";
import Product from "../models/Product";
import Order from "../models/Order";
import { ApiError } from "../utils/ApiError";

interface CartItem {
  productId: string;
  quantity: number;
}

interface ShippingAddress {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export const createCheckoutSession = async (
  buyerId: string,
  cart: CartItem[],
  shippingAddress: ShippingAddress
): Promise<string> => {
  if (!cart || cart.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const productIds = cart.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== cart.length) {
    throw new ApiError(400, "One or more products not found or inactive");
  }

  // Validate stock
  for (const cartItem of cart) {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) throw new ApiError(400, `Product ${cartItem.productId} not found`);
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.title}`);
    }
  }

  // Build line items from DB prices (never trust client)
  const lineItems = cart.map((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId)!;
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.title,
          images: product.images.length > 0 ? [product.images[0]] : [],
        },
        unit_amount: product.price, // price stored in cents
      },
      quantity: cartItem.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
    metadata: { buyerId },
  });

  // Store cart snapshot in Redis (10min TTL)
  const snapshot = {
    buyerId,
    shippingAddress,
    items: cart.map((cartItem) => {
      const product = products.find((p) => p.id === cartItem.productId)!;
      return {
        product: product.id,
        seller: product.seller.toString(),
        title: product.title,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.images[0] || "",
        category: product.category,
        condition: product.condition,
      };
    }),
  };

  await redis.set(`checkout:${session.id}`, JSON.stringify(snapshot), { ex: 600 });

  return session.url!;
};

export const handleCheckoutComplete = async (sessionId: string): Promise<void> => {
  const snapshotRaw = await redis.get<string>(`checkout:${sessionId}`);
  if (!snapshotRaw) {
    throw new ApiError(400, "Checkout session expired or not found");
  }

  const snapshot = typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw;

  // Check if order already exists (idempotency)
  const existing = await Order.findOne({ stripeSessionId: sessionId });
  if (existing) return;

  // Atomic stock decrement
  for (const item of snapshot.items) {
    const result = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!result) {
      throw new ApiError(400, `Stock unavailable for ${item.title}`);
    }
  }

  const totalAmount = snapshot.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  await Order.create({
    buyer: snapshot.buyerId,
    items: snapshot.items.map((item: any) => ({
      ...item,
      status: "pending",
      reviewLeft: false,
    })),
    shippingAddress: snapshot.shippingAddress,
    totalAmount,
    stripeSessionId: sessionId,
    paymentStatus: "paid",
  });

  await redis.del(`checkout:${sessionId}`);
};

export const getOrders = async (
  buyerId: string,
  sessionId?: string
): Promise<any> => {
  const filter: any = { buyer: buyerId };
  if (sessionId) {
    filter.stripeSessionId = sessionId;
  }
  return Order.find(filter).sort({ createdAt: -1 });
};

export const getOrderById = async (
  orderId: string,
  buyerId: string
): Promise<any> => {
  const order = await Order.findOne({ _id: orderId, buyer: buyerId });
  if (!order) throw new ApiError(404, "Order not found");
  return order;
};
