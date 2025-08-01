import { serverConfig } from "@/config";
import {
	createAIProvider,
	createDatabaseProvider,
} from "@/factories/providerFactory.js";
import type { IDatabaseProvider, IGenerativeAIProvider } from "@/providers";
import {
	AnswerRepository,
	CreditsRepository,
	ExperienceRepository,
	InterviewRepository,
	TopicRepository,
} from "@/repositories";
import { CreditsService, InterviewService, TopicService } from "@/services";
import {
	ProcessInterviewWorkflow,
	SelectTopicWorkflow,
	TranscribeAudioWorkflow,
} from "@/workflows";

/**
 * Service Container for dependency injection
 * Manages provider instances and provides singleton access
 */
export class ServiceContainer {
	private static instance: ServiceContainer;
	private aiProvider: IGenerativeAIProvider | null = null;
	private databaseProvider: IDatabaseProvider | null = null;

	private answerRepository: AnswerRepository | null = null;

	private creditsRepository: CreditsRepository | null = null;
	private creditsService: CreditsService | null = null;

	private interviewRepository: InterviewRepository | null = null;
	private interviewService: InterviewService | null = null;

	private topicRepository: TopicRepository | null = null;
	private topicService: TopicService | null = null;

	private experienceRepository: ExperienceRepository | null = null;

	private processInterviewWorkflow: ProcessInterviewWorkflow | null = null;
	private selectTopicWorkflow: SelectTopicWorkflow | null = null;
	private transcribeAudioWorkflow: TranscribeAudioWorkflow | null = null;

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

			// Initialize repositories
			this.creditsRepository = new CreditsRepository(this.databaseProvider);
			this.experienceRepository = new ExperienceRepository(
				this.databaseProvider,
			);
			this.interviewRepository = new InterviewRepository(this.databaseProvider);
			this.answerRepository = new AnswerRepository(this.databaseProvider);
			this.topicRepository = new TopicRepository(this.databaseProvider);

			// Initialize services
			this.creditsService = new CreditsService();
			this.topicService = new TopicService(this.aiProvider);
			this.interviewService = new InterviewService(
				this.aiProvider,
				this.interviewRepository,
				this.answerRepository,
				this.experienceRepository,
			);

			// Initialize workflows
			this.processInterviewWorkflow = new ProcessInterviewWorkflow(
				this.databaseProvider,
				this.creditsRepository,
				this.creditsService,
				this.topicRepository,
				this.topicService,
				this.experienceRepository,
				this.interviewService,
				this.interviewRepository,
			);
			this.selectTopicWorkflow = new SelectTopicWorkflow(
				this.topicRepository,
				this.interviewRepository,
				this.answerRepository,
				this.databaseProvider,
			);
			this.transcribeAudioWorkflow = new TranscribeAudioWorkflow(
				this.creditsRepository,
				this.creditsService,
				this.interviewService,
			);

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
	getAIProvider(): IGenerativeAIProvider {
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
	 * Get credits repository instance
	 */
	getCreditsRepository(): CreditsRepository {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.creditsRepository) {
			throw new Error("Credits repository not initialized");
		}
		return this.creditsRepository;
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
	 * Get experience repository instance
	 */
	getExperienceRepository(): ExperienceRepository {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.experienceRepository) {
			throw new Error("Experience repository not initialized");
		}
		return this.experienceRepository;
	}

	/**
	 * Get interview repository instance
	 */
	getInterviewRepository(): InterviewRepository {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.interviewRepository) {
			throw new Error("Interview repository not initialized");
		}
		return this.interviewRepository;
	}

	/**
	 * Get interview service instance
	 */
	getInterviewService(): InterviewService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.interviewService) {
			throw new Error("Interview service not initialized");
		}
		return this.interviewService;
	}

	getTopicRepository(): TopicRepository {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.topicRepository) {
			throw new Error("Topic repository not initialized");
		}
		return this.topicRepository;
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
	 * Get process interview workflow instance
	 */
	getProcessInterviewWorkflow(): ProcessInterviewWorkflow {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.processInterviewWorkflow) {
			throw new Error("Process interview workflow not initialized");
		}
		return this.processInterviewWorkflow;
	}

	/**
	 * Get select topic workflow instance
	 */
	getSelectTopicWorkflow(): SelectTopicWorkflow {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.selectTopicWorkflow) {
			throw new Error("Select topic workflow not initialized");
		}
		return this.selectTopicWorkflow;
	}

	/**
	 * Get transcribe audio workflow instance
	 */
	getTranscribeAudioWorkflow(): TranscribeAudioWorkflow {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.transcribeAudioWorkflow) {
			throw new Error("Transcribe audio workflow not initialized");
		}
		return this.transcribeAudioWorkflow;
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
		this.creditsRepository = null;
		this.creditsService = null;
		this.topicService = null;
		this.experienceRepository = null;
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
			await this.aiProvider?.close();
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
			ai: boolean;
		};
	}> {
		if (!this.initialized) {
			return {
				healthy: false,
				providers: {
					database: false,
					ai: false,
				},
			};
		}

		const databaseHealthy = (await this.databaseProvider?.isHealthy()) ?? false;
		const aiHealthy = (await this.aiProvider?.isHealthy()) ?? false;
		return {
			healthy: databaseHealthy && aiHealthy,
			providers: {
				database: databaseHealthy,
				ai: aiHealthy,
			},
		};
	}
}
