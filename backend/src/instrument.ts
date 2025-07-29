import * as Sentry from "@sentry/node";
import { monitoringConfig } from "@/config/index.js";

Sentry.init({
	dsn: monitoringConfig.sentry.dsn,
	environment: monitoringConfig.sentry.environment,
	// Tracing
	tracesSampleRate: monitoringConfig.sentry.tracesSampleRate,
	// Setting this option to true will send default PII data to Sentry.
	// For example, automatic IP address collection on events
	sendDefaultPii: true,
	// Enable logs to be sent to Sentry
	_experiments: { enableLogs: true },
});
