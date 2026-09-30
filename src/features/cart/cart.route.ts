// import express from "express";
// import { authenticate } from "../../middlewares/authenticate";
// import { validateObjectId } from "../../middlewares/validateObjectId";
// import {
//   addToCartController,
//   clearCartController,
//   deleteCartItemsController,
//   getCartController,
//   updateCartController,
// } from "./cart.controller";
// import { validateBody } from "../../middlewares/validateBody";
// import { cartSchema } from "./schema/cart.schema";
// import { updateCartSchema } from "./schema/updateCart.schema";

// const router = express.Router();

// router.post(
//   "/:productId",
//   authenticate,
//   validateObjectId("productId"),
//   validateBody(cartSchema),
//   addToCartController,
// );
// router.get("/", authenticate, getCartController);
// router.patch(
//   "/:productId",
//   authenticate,
//   validateObjectId("productId"),
//   validateBody(updateCartSchema),
//   updateCartController,
// );
// router.delete(
//   "/:productId",
//   authenticate,
//   validateObjectId("productId"),
//   deleteCartItemsController,
// );

// router.delete("/", authenticate, clearCartController);
// export default router;

import express from "express";

import { authenticate } from "../../middlewares/authenticate";
import { validateBody } from "../../middlewares/validateBody";
import { validateObjectId } from "../../middlewares/validateObjectId";

import {
  addToCartController,
  getCartController,
  updateCartController,
  clearCartController,
  getCartSummaryController,
  deleteCartItemController,

} from "./cart.controller";

import { cartSchema } from "./schema/cart.schema";
import { updateCartSchema } from "./schema/updateCart.schema";

const router = express.Router();

// Protect all cart routes
router.use(authenticate);

/**
 * GET /cart
 * Get user's cart
 */
router.get("/", getCartController);

/**
 * GET /cart/summary
 * Get cart totals and summary
 */
router.get("/summary", getCartSummaryController);

/**
 * POST /cart/:productId
 * Add product to cart
 */
router.post(
  "/:productId",
  validateObjectId("productId"),
  validateBody(cartSchema),
  addToCartController,
);

/**
 * PATCH /cart/:productId
 * Update item quantity
 */
router.patch(
  "/:productId",
  validateObjectId("productId"),
  validateBody(updateCartSchema),
  updateCartController,
);

/**
 * DELETE /cart/:productId
 * Remove item from cart
 */
router.delete(
  "/:productId",
  validateObjectId("productId"),
  deleteCartItemController,
);

/**
 * DELETE /cart
 * Clear all cart items
 */
router.delete("/", clearCartController);

export default router;