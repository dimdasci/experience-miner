import { serverConfig } from "@/config/index.js";
import {
	createAIProvider,
	createDatabaseProvider,
} from "@/factories/providerFactory.js";
import type {
	IAIProvider,
	IDatabaseProvider,
} from "@/interfaces/providers/index.js";
import { ExperienceRepository } from "@/repositories/experienceRepository.js";
import { CreditsService } from "@/services/creditsService.js";
import { DatabaseService } from "@/services/databaseService.js";
import { ExperienceService } from "@/services/experienceService.js";
import { TopicService } from "@/services/topicService.js";
import { TranscribeService } from "@/services/transcribeService.js";

/**
 * Service Container for dependency injection
 * Manages provider instances and provides singleton access
 */
export class ServiceContainer {
	private static instance: ServiceContainer;
	private aiProvider: IAIProvider | null = null;
	private databaseProvider: IDatabaseProvider | null = null;
	private creditsService: CreditsService | null = null;
	private databaseService: DatabaseService | null = null;
	private topicService: TopicService | null = null;
	private transcribeService: TranscribeService | null = null;
	private experienceRepository: ExperienceRepository | null = null;
	private experienceService: ExperienceService | null = null;
	private initialized = false;

	private constructor() {
		// Providers and services will be initialized lazily
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
			this.aiProvider = createAIProvider();
			this.databaseProvider = createDatabaseProvider();

			// Initialize database provider
			await this.databaseProvider.initialize();

			// Initialize services
			this.creditsService = new CreditsService();
			this.databaseService = new DatabaseService();
			this.topicService = new TopicService();
			this.transcribeService = new TranscribeService();

			// Initialize experience repository and service
			this.experienceRepository = new ExperienceRepository(
				this.databaseProvider,
			);
			this.experienceService = new ExperienceService(this.experienceRepository);

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
		if (!this.aiProvider) {
			throw new Error("AI provider not initialized");
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
		if (!this.databaseProvider) {
			throw new Error("Database provider not initialized");
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
		if (!this.creditsService) {
			throw new Error("Credits service not initialized");
		}
		return this.creditsService;
	}

	/**
	 * Get database service instance
	 */
	getDatabaseService(): DatabaseService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.databaseService) {
			throw new Error("Database service not initialized");
		}
		return this.databaseService;
	}

	/** Get experience service instance, connected to the repository */
	getExperienceService(): ExperienceService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.experienceService) {
			throw new Error("Experience service not initialized");
		}
		return this.experienceService;
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
		if (!this.topicService) {
			throw new Error("Topic service not initialized");
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
		if (!this.transcribeService) {
			throw new Error("Transcribe service not initialized");
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
		this.aiProvider = null;
		this.databaseProvider = null;
		this.creditsService = null;
		this.databaseService = null;
		this.topicService = null;
		this.transcribeService = null;
		this.experienceRepository = null;
		this.experienceService = null;
	}

	/**
	 * Initialize with custom providers and services (for testing)
	 */
	async initializeWithProviders(
		aiProvider: IAIProvider,
		databaseProvider: IDatabaseProvider,
		services?: {
			creditsService?: CreditsService;
			databaseService?: DatabaseService;
			topicService?: TopicService;
			transcribeService?: TranscribeService;
			experienceRepository?: ExperienceRepository;
			experienceService?: ExperienceService;
		},
	): Promise<void> {
		this.aiProvider = aiProvider;
		this.databaseProvider = databaseProvider;

		// Initialize database provider
		await this.databaseProvider.initialize();

		// Initialize services (use provided or create new)
		this.creditsService = services?.creditsService || new CreditsService();
		this.databaseService = services?.databaseService || new DatabaseService();
		this.topicService = services?.topicService || new TopicService();
		this.transcribeService =
			services?.transcribeService || new TranscribeService();
		this.experienceRepository =
			services?.experienceRepository ||
			new ExperienceRepository(this.databaseProvider);
		this.experienceService =
			services?.experienceService ||
			new ExperienceService(this.experienceRepository);

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
			await this.databaseProvider?.close();
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

		const databaseHealthy = (await this.databaseProvider?.isHealthy()) ?? false;

		return {
			healthy: databaseHealthy,
			providers: {
				database: databaseHealthy,
			},
		};
	}
}
