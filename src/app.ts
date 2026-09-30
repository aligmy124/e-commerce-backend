import "./config/env";
import express from "express";
import authRoutes from "./features/auth/auth.routes";
import categoryRoutes from "./features/categories/category.route";
import productRoutes from "./features/products/product.route";
import reviewRoutes from "./features/reviews/review.route";
import cartRoutes from "./features/cart/cart.route";
import orderRoutes from "./features/orders/order.routes";
import paymentRoutes from "./features/payment/payment.routes";
import { errorHandler } from "./middlewares/errorHandler";

import { stripeWebhookController } from "./features/payment/payment.controller";
// stripe > payment/weebhook > event
const app = express();

app.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/reviews", reviewRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payment", paymentRoutes);



app.get("/payment/success", (req, res) => {
  res.send("Payment successful");
});

app.get("/payment/cancelled", (req, res) => {
  res.send("Payment cancelled");
});

app.use(errorHandler);

export default app;