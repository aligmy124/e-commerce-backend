import { z } from "zod";

export const addressSchema = z.object({
  fullName: z
    .string({
      error: "Full name is required",
    })
    .trim()
    .min(3, "Full name must be at least 3 characters"),

  phone: z
    .string({
      error: "Phone is required",
    })
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number"),

  country: z
    .string({
      error: "Country is required",
    })
    .trim()
    .min(2, "Country must be at least 2 characters"),

  city: z
    .string({
      error: "City is required",
    })
    .trim()
    .min(2, "City must be at least 2 characters"),

  street: z
    .string({
      error: "Street is required",
    })
    .trim()
    .min(3, "Street must be at least 3 characters"),

  postalCode: z
    .string({
      error: "Postal code is required",
    })
    .trim()
    .min(4, "Postal code must be at least 4 characters"),
});
export const createOrderSchema = z.object({
  shippingAddress: addressSchema,
});