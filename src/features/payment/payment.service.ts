import Stripe from "stripe";
import mongoose from "mongoose";
import { env } from "../../config/env";
import { stripe } from "../../config/stripe";
import { OrderItem } from "../../models/orders/models/order-item.model";
import { Order } from "../../models/orders/models/order.model";
import { Payment } from "../../models/payment/models/payment.models";
import { Product } from "../../models/products/models/product.model";
import { AppError } from "../../utils/AppError";

export const createCheckoutSession = async (
  orderId: string,
  userId: string,
) => {
  // 1. Find the order belonging to this user
  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // 2. Prevent creating another payment for the same order
  const existingPayment = await Payment.findOne({
    orderId: order._id,
  });

  if (
    existingPayment &&
    ["pending", "paid", "refund_processing"].includes(existingPayment.status)
  ) {
    throw new AppError("Checkout already created for this order", 400);
  }

  // 3. Get order items
  const orderItems = await OrderItem.find({
    orderId: order._id,
  });

  if (!orderItems.length) {
    throw new AppError("Order has no items", 400);
  }

  // 4. Get product IDs
  const productIds = orderItems.map((item) => item.productId);

  // 5. Get products
  const products = await Product.find({
    _id: {
      $in: productIds,
    },
  }).lean();

  // 6. Create Map for O(1) lookup
  const productsMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  // 7. Build Stripe line items
  const lineItems = orderItems.map((item) => {
    const product = productsMap.get(item.productId.toString());

    if (!product) {
      throw new AppError("Product data is inconsistent", 500);
    }

    return {
      price_data: {
        currency: "usd",

        product_data: {
          name: product.name,
        },

        // OrderItem price = snapshot price
        unit_amount: item.price * 100,
      },

      quantity: item.quantity,
    };
  });

  // 8. Create Payment BEFORE Stripe
  const payment = await Payment.create({
    orderId: order._id,
    amount: order.totalPrice,
    method: "credit_card",
    status: "pending",
  });

  try {
    // 9. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: lineItems,

      success_url:
        `${env.CLIENT_URL}/payment/success` +
        "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url: `${env.CLIENT_URL}/payment/cancelled`,

      metadata: {
        orderId: order._id.toString(),
        userId,
      },

      payment_intent_data: {
        metadata: {
          orderId: order._id.toString(),
          userId,
        },
      },
    });

    // 10. Return Checkout URL
    return {
      checkoutURL: session.url,
    };
  } catch (error) {
    // Stripe failed → remove pending Payment
    await Payment.deleteOne({
      _id: payment._id,
    });

    throw error;
  }
};

export const handleCheckoutCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  // 1. Get Order ID from Stripe metadata
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    throw new AppError("Order ID missing", 400);
  }

  // 2. Get PaymentIntent ID
  const paymentIntentId = session.payment_intent?.toString();

  if (!paymentIntentId) {
    throw new AppError("PaymentIntent missing", 400);
  }

  const mongoSession = await mongoose.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      // 3. Find Order
      const order = await Order.findById(orderId).session(mongoSession);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // 4. Find existing Payment
      const payment = await Payment.findOne({
        orderId,
      }).session(mongoSession);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // 5. Idempotency
      if (payment.status === "paid") {
        return;
      }

      // 6. Payment → paid
      payment.status = "paid";

      payment.transactionId = paymentIntentId;

      payment.paidAt = new Date();

      await payment.save({
        session: mongoSession,
      });

      // 7. Order → paid
      order.status = "paid";

      await order.save({
        session: mongoSession,
      });
    });
  } finally {
    await mongoSession.endSession();
  }
};

export const handlePaymentFailed = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  // 1. Get Order ID
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    throw new AppError("Order ID missing", 400);
  }

  const mongoSession = await mongoose.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      // 2. Find Payment
      const payment = await Payment.findOne({
        orderId,
      }).session(mongoSession);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // 3. Idempotency
      if (payment.status === "failed") {
        return;
      }

      // 4. Payment → failed
      payment.status = "failed";

      payment.transactionId = paymentIntent.id;

      await payment.save({
        session: mongoSession,
      });
    });
  } finally {
    await mongoSession.endSession();
  }
};

export const handleAsyncPaymentFailed = async (
  session: Stripe.Checkout.Session,
) => {
  // 1. Get Order ID
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    throw new AppError("Order ID missing", 400);
  }

  // 2. Find Payment
  const payment = await Payment.findOne({
    orderId,
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // 3. Idempotency
  if (payment.status === "failed") {
    return;
  }

  // 4. PaymentIntent ID if available
  const paymentIntentId = session.payment_intent?.toString();

  if (paymentIntentId) {
    payment.transactionId = paymentIntentId;
  }

  // 5. Payment → failed
  payment.status = "failed";

  await payment.save();
};

export const refundOrder = async (orderId: string, userId: string) => {
  // 1. Only paid orders can be refunded
  const order = await Order.findOne({
    _id: orderId,
    userId,
    status: "paid",
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // 2. Find Payment
  const payment = await Payment.findOne({
    orderId: order._id,
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // 3. Prevent duplicate refund
  if (payment.status === "refund_processing") {
    throw new AppError("Refund already in progress", 400);
  }

  if (payment.status === "refunded") {
    throw new AppError("Already refunded", 400);
  }

  // 4. Payment must be paid
  if (payment.status !== "paid") {
    throw new AppError("Payment cannot be refunded", 400);
  }

  // 5. PaymentIntent ID required
  if (!payment.transactionId) {
    throw new AppError("Transaction ID missing", 400);
  }

  // 6. Mark refund as processing
  payment.status = "refund_processing";

  await payment.save();

  try {
    // 7. Ask Stripe for refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
    });

    return {
      message: "Refund requested successfully",

      refundId: refund.id,
    };
  } catch (error) {
    // Stripe request failed
    // Return payment to paid state
    payment.status = "paid";

    await payment.save();

    throw error;
  }
};

export const handleRefundSucceeded = async (refund: Stripe.Refund) => {
  // 1. Get PaymentIntent ID
  const paymentIntentId = refund.payment_intent?.toString();

  if (!paymentIntentId) {
    throw new AppError("PaymentIntent missing", 400);
  }

  const mongoSession = await mongoose.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      // 2. Find Payment using Stripe PaymentIntent
      const payment = await Payment.findOne({
        transactionId: paymentIntentId,
      }).session(mongoSession);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // 3. Idempotency
      if (payment.status === "refunded") {
        return;
      }

      // 4. Refund must actually be processing
      if (payment.status !== "refund_processing") {
        throw new AppError("Payment is not being refunded", 400);
      }

      // 5. Find Order
      const order = await Order.findById(payment.orderId).session(mongoSession);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // 6. Get OrderItems
      const orderItems = await OrderItem.find({
        orderId: order._id,
      }).session(mongoSession);

      // 7. Build stock operations
      const operations = orderItems.map((item) => ({
        updateOne: {
          filter: {
            _id: item.productId,
          },

          update: {
            $inc: {
              stock: item.quantity,
            },
          },
        },
      }));

      // 8. Restore stock
      if (operations.length) {
        await Product.bulkWrite(operations, {
          session: mongoSession,
        });
      }

      // 9. Payment → refunded
      payment.status = "refunded";

      await payment.save({
        session: mongoSession,
      });

      // 10. Order → refunded
      order.status = "refunded";

      await order.save({
        session: mongoSession,
      });
    });
  } finally {
    await mongoSession.endSession();
  }
};
