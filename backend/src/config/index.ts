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
export { serverConfig } from "./server.js";

import { aiConfig } from "./ai.js";
import { authConfig } from "./auth.js";
import { creditsConfig } from "./credits.js";
import { databaseConfig } from "./database.js";
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
			hasGeminiKey: !!aiConfig.providers.gemini.apiKey,
			hasOpenAIKey: !!aiConfig.providers.openai.apiKey,
			tasks: aiConfig.tasks,
		},
		auth: {
			supabaseConfigured: !!authConfig.supabase.url,
		},
		credits: {
			rates: creditsConfig.rates,
		},
	};
};
