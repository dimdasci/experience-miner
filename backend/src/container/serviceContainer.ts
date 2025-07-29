import { serverConfig } from "@/config/index.js";
import { ProviderFactory } from "@/factories/providerFactory.js";
import type {
	IAIProvider,
	IDatabaseProvider,
} from "@/interfaces/providers/index.js";
import { CreditsService } from "@/services/creditsService.js";
import { TopicService } from "@/services/topicService.js";
import { TranscribeService } from "@/services/transcribeService.js";

/**
 * Service Container for dependency injection
 * Manages provider instances and provides singleton access
 */
export class ServiceContainer {
	private static instance: ServiceContainer;
	private aiProvider: IAIProvider;
	private databaseProvider: IDatabaseProvider;
	private creditsService: CreditsService;
	private topicService: TopicService;
	private transcribeService: TranscribeService;
	private initialized = false;

	private constructor() {
		// Providers and services will be initialized lazily
		this.aiProvider = null as any;
		this.databaseProvider = null as any;
		this.creditsService = null as any;
		this.topicService = null as any;
		this.transcribeService = null as any;
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

			// Initialize services
			this.creditsService = new CreditsService();
			this.topicService = new TopicService();
			this.transcribeService = new TranscribeService();

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
	 * Get credits service instance
	 */
	getCreditsService(): CreditsService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		return this.creditsService;
	}

	/**
	 * Get topic service instance
	 */
	getTopicService(): TopicService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		return this.topicService;
	}

	/**
	 * Get transcribe service instance
	 */
	getTranscribeService(): TranscribeService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		return this.transcribeService;
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
		this.creditsService = null as any;
		this.topicService = null as any;
		this.transcribeService = null as any;
	}

	/**
	 * Initialize with custom providers and services (for testing)
	 */
	async initializeWithProviders(
		aiProvider: IAIProvider,
		databaseProvider: IDatabaseProvider,
		services?: {
			creditsService?: CreditsService;
			topicService?: TopicService;
			transcribeService?: TranscribeService;
		},
	): Promise<void> {
		this.aiProvider = aiProvider;
		this.databaseProvider = databaseProvider;

		// Initialize database provider
		await this.databaseProvider.initialize();

		// Initialize services (use provided or create new)
		this.creditsService = services?.creditsService || new CreditsService();
		this.topicService = services?.topicService || new TopicService();
		this.transcribeService = services?.transcribeService || new TranscribeService();

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
