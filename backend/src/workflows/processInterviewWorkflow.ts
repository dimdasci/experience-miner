import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { AnswerRepository } from "@/answers";
import type { CreditsRepository, CreditsService } from "@/credits";
import { type AppError, BadRequestError } from "@/errors";
import type { ExperienceRepository } from "@/experience";
import type { ExtractedFacts } from "@/experience/types";
import type { InterviewRepository } from "@/interviews";
import type {
	DatabaseClient,
	IDatabaseProvider,
	IGenerativeAIProvider,
} from "@/providers";
import type { ModelResponse } from "@/providers/ai";
import type { Topic, TopicRepository } from "@/topics";
import { ExtractFactsFlow } from "./processInterview/extractFactsFlow";
import { generateTopicsFlow } from "./processInterview/generateTopicsFlow";
import { WorkflowBase } from "./shared/workflowBase";
import type { WorkflowResult } from "./shared/workflowTypes";

export class ProcessInterviewWorkflow extends WorkflowBase {
	private databaseProvider: IDatabaseProvider;
	private topicRepo: TopicRepository;
	private experienceRepo: ExperienceRepository;
	private interviewRepo: InterviewRepository;
	private extractFactsFlow: ExtractFactsFlow;
	private generateTopicsFlow: generateTopicsFlow;

	constructor(
		databaseProvider: IDatabaseProvider,
		creditsRepo: CreditsRepository,
		creditsService: CreditsService,
		topicRepo: TopicRepository,
		experienceRepo: ExperienceRepository,
		interviewRepo: InterviewRepository,
		aiProvider: IGenerativeAIProvider,
		answerRepo: AnswerRepository,
	) {
		super(creditsRepo, creditsService);
		this.databaseProvider = databaseProvider;
		this.topicRepo = topicRepo;
		this.experienceRepo = experienceRepo;
		this.interviewRepo = interviewRepo;

		// Initialize the extract facts flow
		this.extractFactsFlow = new ExtractFactsFlow(
			aiProvider,
			interviewRepo,
			answerRepo,
			experienceRepo,
		);

		this.generateTopicsFlow = new generateTopicsFlow(aiProvider);
	}

	execute(userId: string, interviewId: number): TE.TaskEither<AppError, void> {
		const startTime = Date.now();

		return this.executeWithCreditsAndLocking(
			userId,
			"ProcessInterviewWorkflow",
			() => this.runWorkflow(userId, interviewId, startTime),
		);
	}

	private runWorkflow(
		userId: string,
		interviewId: number,
		startTime: number,
	): TE.TaskEither<AppError, void> {
		Sentry.logger?.info?.("Interview extraction workflow started", {
			user_id: userId,
			component: "ProcessInterviewWorkflow",
			interviewId,
		});

		return pipe(
			// Extract facts
			this.extractFactsFlow.execute(interviewId, userId),
			TE.flatMap((extractFactsResult: ModelResponse<ExtractedFacts>) => {
				if (!extractFactsResult.data) {
					return TE.left(
						new BadRequestError("Failed to extract facts from interview"),
					);
				}

				const extractedFacts = extractFactsResult.data;
				const extractionTokenCount =
					extractFactsResult.usage.inputTokens +
					extractFactsResult.usage.outputTokens;

				// Generate Topic Candidates
				return pipe(
					this.generateTopicsFlow.execute(extractedFacts, userId),
					TE.map((topicCandidatesResult: ModelResponse<Topic[]>) => ({
						extractedFacts,
						extractionTokenCount,
						topicCandidatesResult,
					})),
				);
			}),
			TE.flatMap(
				({ extractedFacts, extractionTokenCount, topicCandidatesResult }) => {
					if (!topicCandidatesResult.data) {
						return TE.left(
							new BadRequestError("Failed to generate topic candidates"),
						);
					}

					const newTopics = topicCandidatesResult.data;
					const generationTokenCount =
						topicCandidatesResult.usage.inputTokens +
						topicCandidatesResult.usage.outputTokens;

					const workflowResult: WorkflowResult = {
						extractedFacts,
						newTopics,
						extractionTokenCount,
						generationTokenCount,
						rerankingTokenCount: 0, // TODO: Implement reranking
					};

					// TODO: Rerank Topics
					// return pipe(
					// 	this.topicRepo.getAvailable(userId),
					// 	TE.flatMap((availableTopics) =>
					// 		this.rerankTopicFlow.execute(newTopics, availableTopics, extractedFacts)
					// 	),
					// 	TE.map((rerankedResult) => ({
					// 		...workflowResult,
					// 		newTopics: rerankedResult.data || newTopics,
					// 		rerankingTokenCount: rerankedResult.usage.inputTokens + rerankedResult.usage.outputTokens,
					// 	})),
					// );

					return TE.right(workflowResult);
				},
			),
			// Persist everything in a transaction
			TE.flatMap((workflowResult: WorkflowResult) =>
				this.databaseProvider.transaction((client: DatabaseClient) =>
					this.persistTransaction(
						client,
						userId,
						interviewId,
						workflowResult.extractedFacts,
						workflowResult.newTopics,
						workflowResult.extractionTokenCount,
						workflowResult.generationTokenCount,
						workflowResult.rerankingTokenCount,
					),
				),
			),
			TE.map(() => {
				// Log completion after successful transaction
				Sentry.logger?.info?.("Interview extraction workflow completed", {
					user_id: userId,
					component: "ProcessInterviewWorkflow",
					interviewId,
					processingTime: Date.now() - startTime,
				});
			}),
		);
	}

	private persistTransaction(
		client: DatabaseClient,
		userId: string,
		interviewId: number,
		facts: ExtractedFacts,
		topics: Topic[],
		extractionTokenCount: number,
		generationTokenCount: number,
		rerankingTokenCount: number,
	): TE.TaskEither<AppError, void> {
		return pipe(
			// Save extracted facts
			this.experienceRepo.saveOrUpdateRecord(userId, facts),
			TE.map(() => {
				Sentry.logger?.info?.("Extracted facts saved", {
					user_id: userId,
				});
			}),
			// Save or update topics
			TE.flatMap(() => this.topicRepo.createOrUpdate(userId, topics, client)),
			// Update interview status
			TE.flatMap(() =>
				this.interviewRepo.updateStatus(
					userId,
					interviewId,
					"completed",
					client,
				),
			),
			// Consume credits for extraction
			TE.flatMap(() =>
				this.consumeCredits(userId, extractionTokenCount, "extractor", client),
			),
			// Consume credits for generation
			TE.flatMap(() =>
				this.consumeCredits(
					userId,
					generationTokenCount,
					"topic_generator",
					client,
				),
			),
			// Consume credits for reranking
			TE.flatMap(() =>
				this.consumeCredits(
					userId,
					rerankingTokenCount,
					"topic_ranker",
					client,
				),
			),
			TE.map(() => undefined),
		);
	}
}
