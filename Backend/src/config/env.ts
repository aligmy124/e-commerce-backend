import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string().min(1),

  MONGODB_TEST_URI: z.string().min(1),

  JWT_SECRET: z.string().min(32, {
    message: "JWT_SECRET must contain at least 32 characters",
  }),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().min(1),

  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  SENTRY_DSN: z.string().min(1)
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  console.error(z.prettifyError(result.error));

  process.exit(1);
}

export const env = result.data;
