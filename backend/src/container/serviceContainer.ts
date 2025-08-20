import { AnswerRepository, AnswerService } from "@/answers";
import { serverConfig } from "@/config";
import {
	createDatabaseProvider,
	createGeminiProvider,
	createOpenAIProvider,
} from "@/container/providerFactory.js";
import { CreditsRepository, CreditsService } from "@/credits";
import { ExperienceRepository } from "@/experience";
import { InterviewRepository } from "@/interviews";
import type { IDatabaseProvider, IGenerativeAIProvider } from "@/providers";
import { TopicRepository, TopicService } from "@/topics";
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
	private geminiProvider: IGenerativeAIProvider | null = null;
	private openaiProvider: IGenerativeAIProvider | null = null;
	private databaseProvider: IDatabaseProvider | null = null;

	private answerRepository: AnswerRepository | null = null;
	private answerService: AnswerService | null = null;

	private creditsRepository: CreditsRepository | null = null;
	private creditsService: CreditsService | null = null;

	private interviewRepository: InterviewRepository | null = null;

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
			// Create both AI providers using factory
			this.geminiProvider = createGeminiProvider();
			this.openaiProvider = createOpenAIProvider();
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
			this.topicService = new TopicService(this.topicRepository);
			this.answerService = new AnswerService(this.answerRepository);

			// Initialize workflows with specific providers
			this.processInterviewWorkflow = new ProcessInterviewWorkflow(
				this.databaseProvider,
				this.creditsRepository,
				this.creditsService,
				this.topicRepository,
				this.experienceRepository,
				this.interviewRepository,
				this.openaiProvider, // ✅ For structured extraction tasks
				this.answerRepository,
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
				this.geminiProvider, // ✅ For audio transcription
			);

			this.initialized = true;

			console.log("Service container initialized successfully", {
				geminiProvider: "initialized",
				openaiProvider: "initialized",
				databaseProvider: serverConfig.databaseProvider,
			});
		} catch (error) {
			console.error("Failed to initialize service container:", error);
			throw error;
		}
	}

	/**
	 * Get Gemini provider instance
	 */
	getGeminiProvider(): IGenerativeAIProvider {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.geminiProvider) {
			throw new Error("Gemini provider not initialized");
		}
		return this.geminiProvider;
	}

	/**
	 * Get OpenAI provider instance
	 */
	getOpenAIProvider(): IGenerativeAIProvider {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.openaiProvider) {
			throw new Error("OpenAI provider not initialized");
		}
		return this.openaiProvider;
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
	 * Get answer repository instance
	 */
	getAnswerRepository(): AnswerRepository {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.answerRepository) {
			throw new Error("Answer repository not initialized");
		}
		return this.answerRepository;
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
	 * Get answer service instance
	 */
	getAnswerService(): AnswerService {
		if (!this.initialized) {
			throw new Error(
				"Service container not initialized. Call initialize() first.",
			);
		}
		if (!this.answerService) {
			throw new Error("Answer service not initialized");
		}
		return this.answerService;
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
		this.geminiProvider = null;
		this.openaiProvider = null;
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
			this.geminiProvider?.close();
			this.openaiProvider?.close();
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

		const databaseHealthResult = await this.databaseProvider?.isHealthy()();
		const databaseHealthy: boolean =
			databaseHealthResult?._tag === "Right"
				? databaseHealthResult.right
				: false;
		const geminiHealthy: boolean = this.geminiProvider?.isHealthy() ?? false;
		const openaiHealthy: boolean = this.openaiProvider?.isHealthy() ?? false;
		return {
			healthy: databaseHealthy && geminiHealthy && openaiHealthy,
			providers: {
				database: databaseHealthy,
				ai: geminiHealthy && openaiHealthy,
			},
		};
	}
}
