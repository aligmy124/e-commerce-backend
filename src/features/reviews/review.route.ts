import express from "express"
import { authenticate } from "../../middlewares/authenticate";
import { validateBody } from "../../middlewares/validateBody";
import { reviewSchema } from "./schema/review.schema";
import { validateObjectId } from "../../middlewares/validateObjectId";
import { addReviewController, deleteReviewController, getAllReviewsController, getProductReviewsController } from "./review.controller";

const router=express.Router();

router.post(
  "/:productId",
  authenticate,
  validateObjectId("productId"),
  validateBody(reviewSchema),
  addReviewController,
);

router.get(
  "/product/:productId",
  validateObjectId("productId"),
  getProductReviewsController,
);

router.get(
  "/",
  getAllReviewsController,
);

router.delete(
  "/:reviewId",
  authenticate,
  validateObjectId("reviewId"),
  deleteReviewController,
);
export default router