import * as Sentry from "@sentry/node";
import { env } from "@/common/utils/envConfig.js";

Sentry.init({
	dsn: env.SENTRY_DSN_BACKEND,
	environment: env.SENTRY_ENVIRONMENT,
	// Tracing
	tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
	// Setting this option to true will send default PII data to Sentry.
	// For example, automatic IP address collection on events
	sendDefaultPii: true,
	// Enable logs to be sent to Sentry
	_experiments: { enableLogs: true },
});
