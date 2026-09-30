import mongoose from "mongoose";
import { z } from "zod";
export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name must be at most 100 characters")
      .optional(),
      
    description: z
      .string()
      .trim()
      .max(500, "Description must be at most 500 characters")
      .optional(),
      
    brand: z.string().trim().optional(),
    price: z.coerce
      .number()
      .min(0, "Price cannot be negative")
      .optional(),
    stock: z.coerce
      .number()
      .min(0, "Stock cannot be negative")
      .optional(),
    isActive: z
      .preprocess((value) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
      }, z.boolean())
      .default(true),
    categoryId: z
      .string()
      .refine(
        (value) => mongoose.Types.ObjectId.isValid(value),
        "Invalid category id",
      )
      .optional(),
  })
  .strict();
