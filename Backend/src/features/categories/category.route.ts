import express from "express";

import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateBody } from "../../middlewares/validateBody";
import { validateObjectId } from "../../middlewares/validateObjectId";

import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
} from "./category.controller";

import { categorySchema } from "./schema/category.schema";
import { updateCategorySchema } from "./schema/updateCategorySchema";

const router = express.Router();

/**
 * Public Routes
 */
router.get("/", getCategoriesController);

router.get(
  "/:categoryId",
  validateObjectId("categoryId"),
  getCategoryByIdController,
);

/**
 * Admin Routes
 */
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validateBody(categorySchema),
  createCategoryController,
);

router.patch(
  "/:categoryId",
  authenticate,
  authorize(["admin"]),
  validateObjectId("categoryId"),
  validateBody(updateCategorySchema),
  updateCategoryController,
);

router.delete(
  "/:categoryId",
  authenticate,
  authorize(["admin"]),
  validateObjectId("categoryId"),
  deleteCategoryController,
);

export default router;