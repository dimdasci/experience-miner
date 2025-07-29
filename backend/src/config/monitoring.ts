import { z } from "zod";
import "dotenv/config";

// Monitoring configuration schema - sensitive/environment-specific only
const monitoringSchema = z.object({
	sentryDsn: z.string().optional(),
	sentryEnvironment: z.string().default("development"),
	sentryTracesSampleRate: z.coerce.number().min(0).max(1).default(1.0),
});

// Parse and validate environment variables
const monitoringEnv = monitoringSchema.parse({
	sentryDsn: process.env.SENTRY_DSN_BACKEND,
	sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
	sentryTracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE,
});

export const monitoringConfig = {
	// Sensitive/environment-specific (from environment)
	sentry: {
		dsn: monitoringEnv.sentryDsn,
		environment: monitoringEnv.sentryEnvironment,
		tracesSampleRate: monitoringEnv.sentryTracesSampleRate,
	},
};
