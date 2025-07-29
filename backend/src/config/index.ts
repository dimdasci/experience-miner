/**
 * Configuration Index
 *
 * Centralized exports for all domain-specific configurations.
 * Each domain handles its own environment variables and validation.
 */

export { aiConfig } from "./ai.js";
export { authConfig } from "./auth.js";
export { creditsConfig } from "./credits.js";
export { databaseConfig } from "./database.js";
export { monitoringConfig } from "./monitoring.js";
export { serverConfig } from "./server.js";

import { aiConfig } from "./ai.js";
import { authConfig } from "./auth.js";
import { creditsConfig } from "./credits.js";
import { databaseConfig } from "./database.js";
import { monitoringConfig } from "./monitoring.js";
import { serverConfig } from "./server.js";

// Health check for all configurations
export const getConfigHealth = () => {
	return {
		server: {
			port: serverConfig.port,
			environment: serverConfig.nodeEnv,
		},
		database: {
			host: databaseConfig.connection.host ? "configured" : "missing",
			pool: databaseConfig.pool.max,
		},
		ai: {
			hasApiKey: !!aiConfig.apiKey,
			rateLimits: aiConfig.rateLimits,
		},
		auth: {
			supabaseConfigured: !!authConfig.supabase.url,
		},
		monitoring: {
			sentryEnabled: !!monitoringConfig.sentry.dsn,
			environment: monitoringConfig.sentry.environment,
		},
		credits: {
			rates: creditsConfig.rates,
		},
	};
};
