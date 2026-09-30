// import express from "express";
// import { authenticate } from "../../middlewares/authenticate";
// import { authorize } from "../../middlewares/authorize";
// import { upload } from "../../middlewares/upload.middleware";
// import { validateBody } from "../../middlewares/validateBody";
// import { productSchema } from "./schema/product.schema";
// import {
//   createProductController,
//   deleteProductController,
//   getProductDetailsController,
//   getProductsController,
//   updateProductController,
// } from "./product.controller";
// import { validateObjectId } from "../../middlewares/validateObjectId";
// import { updateProductSchema } from "./schema/update.product.schema";

// const router = express.Router();

// router.post(
//   "/",
//   authenticate,
//   authorize(["admin"]),
//   upload.array("images", 10),
//   validateBody(productSchema),
//   createProductController,
// );
// router.get("/", getProductsController);
// router.get(
//   "/details/:productId",
//   validateObjectId("productId"),
//   getProductDetailsController,
// );
// router.put(
//   "/:productId",
//   authenticate,
//   authorize(["admin"]),
//   validateObjectId("productId"),
//   upload.array("images", 10),
//   validateBody(updateProductSchema),
//   updateProductController,
// );
// router.delete(
//   "/:productId",
//   validateObjectId("productId"),
//   deleteProductController,
// );
// export default router;
import express from "express";

import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { upload } from "../../middlewares/upload.middleware";
import { validateBody } from "../../middlewares/validateBody";
import { validateObjectId } from "../../middlewares/validateObjectId";

import {
  createProductController,
  deleteProductController,
  getProductDetailsController,
  getProductsController,
  updateProductController,
} from "./product.controller";

import { productSchema } from "./schema/product.schema";
import { updateProductSchema } from "./schema/update.product.schema";

const router = express.Router();

/**
 * Public Routes
 */
router.get("/", getProductsController);

router.get(
  "/:productId",
  validateObjectId("productId"),
  getProductDetailsController,
);

/**
 * Admin Routes
 */
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  upload.array("images", 10),
  validateBody(productSchema),
  createProductController,
);

router.patch(
  "/:productId",
  authenticate,
  authorize(["admin"]),
  validateObjectId("productId"),
  upload.array("images", 10),
  validateBody(updateProductSchema),
  updateProductController,
);

router.delete(
  "/:productId",
  authenticate,
  authorize(["admin"]),
  validateObjectId("productId"),
  deleteProductController,
);

export default router;