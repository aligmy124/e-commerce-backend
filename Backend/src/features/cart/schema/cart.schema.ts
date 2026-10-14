import z from "zod";

export const cartSchema = z.object({
  quantity: z
    .number({
      error: "quantity is required",
    })
    .min(1, "Quantity must be at least 1"),
});
