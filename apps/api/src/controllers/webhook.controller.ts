import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { handleCheckoutComplete } from "../services/order.service";

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ success: false, message: "Missing stripe-signature header" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).json({ success: false, message: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await handleCheckoutComplete(session.id);
    } catch (err) {
      console.error("Error handling checkout.session.completed:", err);
    }
  }

  res.json({ received: true });
};
