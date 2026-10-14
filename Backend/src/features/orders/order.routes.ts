import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { addressSchema, createOrderSchema } from "./schema/order.schema";
import { validateBody } from "../../middlewares/validateBody";
import {
  allOrdersController,
  cancelOrderController,
  createOrderController,
  getMyOrderController,
  getMyOrdersController,
  updateOrderStatusController,
} from "./controllers/order.controller";
import { validateObjectId } from "../../middlewares/validateObjectId";
import { authorize } from "../../middlewares/authorize";
import { updateOrderStatusSchema } from "./schema/updateOrderStatusSchema";
const router = express.Router();

router.post(
  "/",
  authenticate,
  validateBody(createOrderSchema),
  createOrderController,
);
router.get("/me", authenticate, getMyOrdersController);
router.get("/", authenticate, authorize(["admin"]), allOrdersController);

router.get(
  "/me/:orderId",
  authenticate,
  validateObjectId("orderId"),
  getMyOrderController,
);
router.patch(
  "/cancel/:orderId",
  authenticate,
  validateObjectId("orderId"),
  cancelOrderController,
);

router.patch(
  "/:orderId",
  authenticate,
  authorize(["admin"]),
  validateObjectId("orderId"),
  validateBody(updateOrderStatusSchema),
  updateOrderStatusController,
);

export default router;
