import { serverConfig } from "@/config/index.js";
import type {
	IAIProvider,
	IDatabaseProvider,
} from "@/interfaces/providers/index.js";
import {
	GoogleAIProvider,
	MockAIProvider,
	MockDatabaseProvider,
	PostgresProvider,
} from "@/providers/index.js";

/**
 * Factory for creating provider instances based on configuration
 * Supports runtime provider selection via environment variables
 */
export class ProviderFactory {
	/**
	 * Create AI provider instance based on configuration
	 * @param providerType - Optional override for provider type
	 * @returns AI provider instance
	 */
	static createAIProvider(providerType?: string): IAIProvider {
		const type = providerType || serverConfig.aiProvider;

		switch (type.toLowerCase()) {
			case "google":
			case "gemini":
				return new GoogleAIProvider();

			case "mock":
			case "test":
				return new MockAIProvider();

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
	static createDatabaseProvider(providerType?: string): IDatabaseProvider {
		const type = providerType || serverConfig.databaseProvider;

		switch (type.toLowerCase()) {
			case "postgres":
			case "postgresql":
				return new PostgresProvider();

			case "mock":
			case "test":
			case "memory":
				return new MockDatabaseProvider();

			default:
				throw new Error(
					`Unknown database provider type: ${type}. Supported types: postgres, mock`,
				);
		}
	}

	/**
	 * Create providers for testing environment
	 * @returns Object with mock providers for testing
	 */
	static createTestProviders(): {
		aiProvider: IAIProvider;
		databaseProvider: IDatabaseProvider;
	} {
		return {
			aiProvider: new MockAIProvider(),
			databaseProvider: new MockDatabaseProvider(),
		};
	}

	/**
	 * Create providers for production environment
	 * @returns Object with production providers
	 */
	static createProductionProviders(): {
		aiProvider: IAIProvider;
		databaseProvider: IDatabaseProvider;
	} {
		return {
			aiProvider: new GoogleAIProvider(),
			databaseProvider: new PostgresProvider(),
		};
	}

	/**
	 * Get available provider types for documentation/debugging
	 */
	static getAvailableProviders(): {
		ai: string[];
		database: string[];
	} {
		return {
			ai: ["google", "mock"],
			database: ["postgres", "mock"],
		};
	}
}
