// import mongoose from "mongoose";
// import { z } from "zod";
// export const productSchema = z
//   .object({
//     name: z
//       .string({ error: "Name is required" })
//       .min(3, "Name must be at least 3 characters")
//       .max(100, "Name must be at most 100 characters")
//       .trim(),
//     description: z
//       .string({ error: "Description is required" })
//       .max(500, "Description must be at most 500 characters")
//       .trim(),
//     brand: z.string({ error: "Brand is required" }).trim(),
//     price: z.coerce
//       .number({ error: "Price is required" })
//       .min(0, "Price cannot be negative"),
//     stock: z.coerce
//       .number({ error: "Stock is required" })
//       .min(0, "Stock cannot be negative"),
//     isActive: z
//       .preprocess((value) => {
//         if (value === "true") return true;
//         if (value === "false") return false;
//         return value;
//       }, z.boolean())
//       .default(true),
//     categoryId: z
//       .string({
//         error: "Category is required",
//       })
//       .refine(
//         (value) => mongoose.Types.ObjectId.isValid(value),
//         "Invalid category id",
//       ),
//   })
//   .strict();
import mongoose from "mongoose";
import { z } from "zod";

export const productSchema = z
  .object({
    name: z
      .string({
        error: "Name is required",
      })
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name must be at most 100 characters"),

    description: z
      .string({
        error: "Description is required",
      })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be at most 500 characters"),

    brand: z
      .string({
        error: "Brand is required",
      })
      .trim()
      .min(2, "Brand must be at least 2 characters")
      .max(50, "Brand must be at most 50 characters"),

    price: z.coerce
      .number({
        error: "Price is required",
      })
      .positive("Price must be greater than 0"),

    stock: z.coerce
      .number({
        error: "Stock is required",
      })
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative"),

    isActive: z.preprocess(
      (value) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
      },
      z.boolean(),
    ).default(true),

    categoryId: z
      .string({
        error: "Category is required",
      })
      .refine(
        (value) => mongoose.Types.ObjectId.isValid(value),
        {
          message: "Invalid category id",
        },
      ),
  })
  .strict();

export type CreateProductInput = z.infer<typeof productSchema>;