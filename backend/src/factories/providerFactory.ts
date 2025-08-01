import { serverConfig } from "@/config";
import type { IDatabaseProvider, IGenerativeAIProvider } from "@/providers";
import { GeminiProvider, PostgresProvider } from "@/providers";

/**
 * Create AI provider instance based on configuration
 * @param providerType - Optional override for provider type
 * @returns AI provider instance
 */
export function createAIProvider(providerType?: string): IGenerativeAIProvider {
	const type = providerType || serverConfig.aiProvider;

	switch (type.toLowerCase()) {
		case "google":
		case "gemini":
			return new GeminiProvider();

		// case "mock":
		// case "test":
		// 	return new MockAIProvider();

		default:
			throw new Error(
				`Unknown AI provider type: ${type}. Supported types: google, mock`,
			);
	}
}

/**
 * Create database provider instance based on configuration
 * @param providerType - Optional override for provider type
 * @returns Database provider instance
 */
export function createDatabaseProvider(
	providerType?: string,
): IDatabaseProvider {
	const type = providerType || serverConfig.databaseProvider;

	switch (type.toLowerCase()) {
		case "postgres":
		case "postgresql":
			return new PostgresProvider();

		// case "mock":
		// case "test":
		// case "memory":
		// 	return new MockDatabaseProvider();

		default:
			throw new Error(
				`Unknown database provider type: ${type}. Supported types: postgres, mock`,
			);
	}
}

/**
 * Get available provider types for documentation/debugging
 */
export function getAvailableProviders(): {
	ai: string[];
	database: string[];
} {
	return {
		ai: ["google", "mock"],
		database: ["postgres", "mock"],
	};
}
