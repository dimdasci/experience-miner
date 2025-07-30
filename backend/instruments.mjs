import * as Sentry from "@sentry/node";

// Load environment variables from .env if present
import "dotenv/config";

Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  environment: process.env.SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
  sendDefaultPii: true,
  _experiments: { enableLogs: true },
});