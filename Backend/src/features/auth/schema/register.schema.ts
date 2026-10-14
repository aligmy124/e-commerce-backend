import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(3, "firstName must be at least 3 characters"),
    lastName: z.string().trim().min(3, "lastName must be at least 3 characters"),

    email: z.string({
      error:"Email is required",
    }).trim().toLowerCase().email("Invalid email format"),

    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters"),

    phone: z
      .string()
      .trim()
      .nonempty("Phone number is required")
      .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
  })
  .strict();

export type RegisterFormData = z.infer<typeof registerSchema>;
