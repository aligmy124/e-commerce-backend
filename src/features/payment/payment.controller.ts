import { RequestHandler } from "express";

import {
  createCheckoutSession,
  handleAsyncPaymentFailed,
  handleCheckoutCompleted,
  handlePaymentFailed,
  handleRefundSucceeded,
  refundOrder,
} from "./payment.service";

import { stripe } from "./../../config/stripe";
import { env } from "./../../config/env";

// CREATE CHECKOUT SESSION

export const checkoutController: RequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await createCheckoutSession(orderId, req.user.id);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// STRIPE WEBHOOK

export const stripeWebhookController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing Stripe signature");
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET as string,
    );

    switch (event.type) {
      // CHECKOUT COMPLETED
      case "checkout.session.completed": {
        const session = event.data.object;

        await handleCheckoutCompleted(session);

        break;
      }
      // PAYMENT INTENT FAILED
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        await handlePaymentFailed(paymentIntent);

        break;
      }

      //
      // ASYNC PAYMENT FAILED
      //

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;

        await handleAsyncPaymentFailed(session);

        break;
      }

      //
      // REFUND SUCCEEDED
      //

      case "refund.updated": {
        const refund = event.data.object;

        if (refund.status === "succeeded") {
          await handleRefundSucceeded(refund);
        }

        break;
      }
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("STRIPE WEBHOOK ERROR:", error);

    next(error);
  }
};

// REFUND ORDER

export const refundOrderController: RequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await refundOrder(orderId, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
