import * as Sentry from "@sentry/node";
import type { CreditsRepository, CreditsService } from "@/credits";
import type { ExperienceRepository } from "@/experience";
import type { ExtractedFacts } from "@/experience/types";
import type { InterviewRepository, InterviewService } from "@/interviews";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { Topic, TopicRepository, TopicService } from "@/topics";

export class ProcessInterviewWorkflow {
	private databaseProvider: IDatabaseProvider;
	private creditsRepo: CreditsRepository;
	private creditsService: CreditsService;
	private topicRepo: TopicRepository;
	private topicService: TopicService;
	private experienceRepo: ExperienceRepository;
	private interviewService: InterviewService;
	private interviewRepo: InterviewRepository;

	constructor(
		databaseProvider: IDatabaseProvider,
		creditsRepo: CreditsRepository,
		creditsService: CreditsService,
		topicRepo: TopicRepository,
		topicService: TopicService,
		experienceRepo: ExperienceRepository,
		interviewService: InterviewService,
		interviewRepo: InterviewRepository,
	) {
		this.databaseProvider = databaseProvider;
		this.creditsRepo = creditsRepo;
		this.creditsService = creditsService;
		this.topicRepo = topicRepo;
		this.topicService = topicService;
		this.experienceRepo = experienceRepo;
		this.interviewService = interviewService;
		this.interviewRepo = interviewRepo;
	}

	async execute(userId: string, interviewId: number): Promise<void> {
		// Check for concurrent operations
		if (await this.creditsService.checkUserLock(userId)) {
			throw new Error(
				"Another operation is in progress, please wait and try again",
			);
		}
		// Set user lock for entire workflow
		this.creditsService.setUserLock(userId);

		// check available credits
		const currentCredits = await this.creditsRepo.getCurrentBalance(userId);
		if (currentCredits <= 0) {
			throw new Error("Not enough credits");
		}

		// Run the process workflow
		try {
			await this.runWorkflow(userId, interviewId);
		} catch (error) {
			Sentry.captureException(error, {
				tags: { endpoint: "extract", status: "error" },
				contexts: {
					request: { interviewId, userId },
				},
			});

			Sentry.logger?.error?.("Interview extraction workflow failed", {
				user_id: userId,
				interviewId,
				error: error instanceof Error ? error.message : String(error),
			});

			throw error;
		} finally {
			// Release user lock after processing
			this.creditsService.removeUserLock(userId);
		}
	}

	private async runWorkflow(
		userId: string,
		interviewId: number,
	): Promise<void> {
		const startTime = Date.now();

		Sentry.logger?.info?.("Interview extraction workflow started", {
			user_id: userId,
			component: "ProcessInterviewWorkflow",
			interviewId,
		});

		// Extract facts
		const extractFactsResult = await this.interviewService.extractFacts(
			interviewId,
			userId,
		);

		if (!extractFactsResult.data) {
			throw new Error("Failed to extract facts from interview");
		}
		const extractedFacts = extractFactsResult.data;
		const extractionTokenCount =
			extractFactsResult.usage.inputTokens +
			extractFactsResult.usage.outputTokens;

		// Generate Topic Candidates
		const topicCandidatesResult =
			await this.topicService.generateTopicCandidates(
				extractFactsResult.data,
				userId,
			);

		if (!topicCandidatesResult.data) {
			throw new Error("Failed to generate topic candidates");
		}
		const newTopics = topicCandidatesResult.data;
		const generationTokenCount =
			topicCandidatesResult.usage.inputTokens +
			topicCandidatesResult.usage.outputTokens;

		// TODO: Rerank Topics
		// const rerankedTopicsResult = await this.topicService.rerankAllTopics(
		// 	topicCandidatesResult.data,
		// 	await this.topicRepo.getAvailable(userId),
		// 	extractFactsResult.data,
		// );

		// if (!rerankedTopicsResult.data) {
		// 	throw new Error("Failed to rerank topics");
		// }
		// const rerankedTopics = rerankedTopicsResult.data;
		// const rerankingTokenCount =
		// 	rerankedTopicsResult.usage.inputTokens +
		// 	rerankedTopicsResult.usage.outputTokens;

		await this.databaseProvider.transaction(async (client: DatabaseClient) => {
			this.persistTransaction(
				client,
				userId,
				interviewId,
				extractedFacts,
				newTopics, // rerankedTopics,
				extractionTokenCount,
				generationTokenCount,
				0, //rerankingTokenCount,
			);
		});

		Sentry.logger?.info?.("Interview extraction workflow completed", {
			user_id: userId,
			component: "ProcessInterviewWorkflow",
			interviewId,
			processingTime: Date.now() - startTime,
			consumed_tokens: {
				extraction: extractionTokenCount,
				topic_generation: generationTokenCount,
				topic_reranking: 0, // rerankingTokenCount,
			},
			extracted: {
				companies: extractedFacts.companies.length,
				roles: extractedFacts.roles.length,
				projects: extractedFacts.projects.length,
				achievements: extractedFacts.achievements.length,
				skills: extractedFacts.skills.length,
			},
		});
	}

	private async persistTransaction(
		client: DatabaseClient,
		userId: string,
		interviewId: number,
		facts: ExtractedFacts,
		topics: Topic[],
		extractionTokenCount: number,
		generationTokenCount: number,
		rerankingTokenCount: number,
	): Promise<void> {
		// Save extracted facts
		this.experienceRepo.saveOrUpdateRecord(userId, facts);
		Sentry.logger?.info?.("Extracted facts saved", {
			user_id: userId,
		});

		// Save or update topics
		this.topicRepo.createOrUpdate(userId, topics, client);

		// Update interview status
		this.interviewRepo.updateStatus(userId, interviewId, "completed", client);

		// Consume credits
		this.creditsRepo.consumeCredits(
			userId,
			extractionTokenCount,
			"extractor",
			client,
		);
		this.creditsRepo.consumeCredits(
			userId,
			generationTokenCount,
			"topic_generator",
			client,
		);
		this.creditsRepo.consumeCredits(
			userId,
			rerankingTokenCount,
			"topic_ranker",
			client,
		);
	}
}
