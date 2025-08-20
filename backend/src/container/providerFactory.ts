import { serverConfig } from "@/config";
import type { IDatabaseProvider, IGenerativeAIProvider } from "@/providers";
import { GeminiProvider, OpenAIProvider, PostgresProvider } from "@/providers";

/**
 * Create Gemini provider instance
 * @returns Gemini AI provider instance
 */
export function createGeminiProvider(): GeminiProvider {
	return new GeminiProvider();
}

/**
 * Create OpenAI provider instance
 * @returns OpenAI provider instance
 */
export function createOpenAIProvider(): OpenAIProvider {
	return new OpenAIProvider();
}

/**
 * Create AI provider instance based on configuration (backward compatibility)
 * @param providerType - Optional override for provider type
 * @returns AI provider instance
 */
export function createAIProvider(providerType?: string): IGenerativeAIProvider {
	const type = providerType || serverConfig.aiProvider;

	switch (type.toLowerCase()) {
		case "google":
		case "gemini":
			return createGeminiProvider();
		case "openai":
			return createOpenAIProvider();

		// case "mock":
		// case "test":
		// 	return new MockAIProvider();

		default:
			throw new Error(
				`Unknown AI provider type: ${type}. Supported types: google, openai, mock`,
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
		ai: ["google", "openai", "mock"],
		database: ["postgres", "mock"],
	};
}
