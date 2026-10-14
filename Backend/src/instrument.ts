import * as Sentry from "@sentry/node";
import "./config/env";

Sentry.init({
dsn: process.env.SENTRY_DSN,
environment: process.env.NODE_ENV || "development",
tracesSampleRate:
process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
