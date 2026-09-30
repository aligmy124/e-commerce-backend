import z from "zod";

export const updateCartSchema = z.object({
  quantity: z
    .number()
    .min(1, "Quantity must be at least 1"),
});
