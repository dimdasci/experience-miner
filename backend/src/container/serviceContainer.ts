import { serverConfig } from "@/config/index.js";
import { ProviderFactory } from "@/factories/providerFactory.js";
import type {
	IAIProvider,
	IDatabaseProvider,
} from "@/interfaces/providers/index.js";

/**
 * Service Container for dependency injection
 * Manages provider instances and provides singleton access
 */
export class ServiceContainer {
	private static instance: ServiceContainer;
	private aiProvider: IAIProvider;
	private databaseProvider: IDatabaseProvider;
	private initialized = false;

	private constructor() {
		// Providers will be initialized lazily
		this.aiProvider = null as any;
		this.databaseProvider = null as any;
	}

	/**
	 * Get singleton instance of service container
	 */
	static getInstance(): ServiceContainer {
		if (!ServiceContainer.instance) {
			ServiceContainer.instance = new ServiceContainer();
		}
		return ServiceContainer.instance;
	}

	/**
	 * Initialize container with providers
	 * Should be called once during application startup
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			// Create providers using factory
			this.aiProvider = ProviderFactory.createAIProvider();
			this.databaseProvider = ProviderFactory.createDatabaseProvider();

			// Initialize database provider
			await this.databaseProvider.initialize();

			this.initialized = true;

			console.log("Service container initialized successfully", {
				aiProvider: serverConfig.aiProvider,
				databaseProvider: serverConfig.databaseProvider,
			});
		} catch (error) {
			console.error("Failed to initialize service container:", error);
			throw error;
		}
	}

	/**
	 * Get AI provider instance
	 */
	getAIProvider(): IAIProvider {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		return this.aiProvider;
	}

	/**
	 * Get database provider instance
	 */
	getDatabaseProvider(): IDatabaseProvider {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		return this.databaseProvider;
	}

	/**
	 * Check if container is initialized
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Reset container (mainly for testing)
	 */
	reset(): void {
		this.initialized = false;
		this.aiProvider = null as any;
		this.databaseProvider = null as any;
	}

	/**
	 * Initialize with custom providers (for testing)
	 */
	async initializeWithProviders(
		aiProvider: IAIProvider,
		databaseProvider: IDatabaseProvider,
	): Promise<void> {
		this.aiProvider = aiProvider;
		this.databaseProvider = databaseProvider;

		// Initialize database provider
		await this.databaseProvider.initialize();

		this.initialized = true;
	}

	/**
	 * Cleanup resources
	 */
	async cleanup(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		try {
			await this.databaseProvider.close();
			this.reset();
			console.log("Service container cleaned up successfully");
		} catch (error) {
			console.error("Error during service container cleanup:", error);
			throw error;
		}
	}

	/**
	 * Health check for all providers
	 */
	async healthCheck(): Promise<{
		healthy: boolean;
		providers: {
			database: boolean;
		};
	}> {
		if (!this.initialized) {
			return {
				healthy: false,
				providers: {
					database: false,
				},
			};
		}

		const databaseHealthy = await this.databaseProvider.isHealthy();

		return {
			healthy: databaseHealthy,
			providers: {
				database: databaseHealthy,
			},
		};
	}
}
