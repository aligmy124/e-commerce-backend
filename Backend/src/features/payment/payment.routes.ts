import express from "express";

import { authenticate } from "../../middlewares/authenticate";
import { validateObjectId } from "../../middlewares/validateObjectId";

import {
  checkoutController,
  refundOrderController,
} from "./payment.controller";

const router = express.Router();

router.post(
  "/:orderId",
  authenticate,
  validateObjectId("orderId"),
  checkoutController,
);

router.post(
  "/:orderId/refund",
  authenticate,
  validateObjectId("orderId"),
  refundOrderController,
);

export default router;




//stripe listen --events checkout.session.completed,payment_intent.payment_failed,checkout.session.async_payment_failed,refund.updated --forward-to localhost:5000/payment/webhook

