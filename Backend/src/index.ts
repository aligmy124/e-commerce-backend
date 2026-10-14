import "dotenv/config";
import { connectDB } from "./config/db";
import app from "./app";
import { createAdmin } from "./seeds/createAdmin";
import { env } from "./config/env";
import mongoose from "mongoose";
import { logger } from "./config/logger";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const result = await createAdmin();
    if (result.user?.email) {
      logger.info("✅ Admin initialization completed");
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exit(1);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} signal received: closing HTTP server safely...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          logger.info("Database connection closed.");
          process.exit(0);
        } catch (dbError) {
          console.error("Error during database shutdown:", dbError);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

void startServer();
