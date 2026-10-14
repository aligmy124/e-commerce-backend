import "./config/env";
import * as Sentry from "@sentry/node";
import express from "express";
import authRoutes from "./features/auth/auth.routes";
import categoryRoutes from "./features/categories/category.route";
import productRoutes from "./features/products/product.route";
import reviewRoutes from "./features/reviews/review.route";
import cartRoutes from "./features/cart/cart.route";
import orderRoutes from "./features/orders/order.routes";
import paymentRoutes from "./features/payment/payment.routes";
import usersRoutes from "./features/users/users.route";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./config/logger";
import { stripeWebhookController } from "./features/payment/payment.controller";
import { requestLogger } from "./middlewares/request-logger.middleware";
import type { ErrorRequestHandler } from "express";
//sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN, // رابط الـ DSN الخاص بمشروعك على موقع sentry.io
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0, // نسبة تتبع الأداء (Performance Tracing)
});
// stripe > payment/weebhook > event
const app = express();
app.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.use(express.json());
app.use(requestLogger);

app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/reviews", reviewRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payment", paymentRoutes);
app.use("/users", usersRoutes);



app.get("/payment/success", (req, res) => {
  res.send("Payment successful");
});

app.get("/payment/cancelled", (req, res) => {
  res.send("Payment cancelled");
});


app.use(errorHandler);


export default app;