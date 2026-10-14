import { z } from "zod";

export const categorySchema = z
  .object({
    name: z
      .string({
        error: "Category name is required",
      })
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be at most 50 characters"),

    description: z
      .string({
        error: "Description is required",
      })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be at most 500 characters"),

    isActive: z.preprocess(
      (value) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
      },
      z.boolean(),
    ).default(true),
  })
  .strict();

export type CategoryDataForm = z.infer<
  typeof categorySchema
>;