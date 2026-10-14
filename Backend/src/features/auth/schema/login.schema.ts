import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({
      error:"Email is required",
    })
    .trim()
    .toLowerCase()
    .email("Invalid email format"),

  password: z
    .string({
      error: "Password is required"
    })
    .trim()
    .min(8, "Password must be at least 8 characters")
}).strict();

export type LoginFormData=z.infer<typeof loginSchema>