import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { aiConfig } from "@/config";
import { INITIAL_TOPICS } from "@/constants/initialTopics.js";
import {
	topicGenerationPrompt,
	topicRankingPrompt,
	topicSystemPrompt,
} from "@/constants/topicPrompts";
import type { AppError } from "@/errors";
import type { ExtractedFacts } from "@/experience/types";
import type {
	IGenerativeAIProvider,
	ModelResponse,
	Usage,
} from "@/providers/ai";
import { fillTemplate } from "@/utils";
import type { TopicRepository } from "./topicRepository.js";
import type {
	Topic,
	TopicRanking,
	TopicStatus,
	// TopicCandidates
} from "./types.js";
import { TopicCandidatesSchema, TopicRankingSchema } from "./types.js";

/**
 * Service for topic generation and management operations
 * Uses AI provider for topic generation and ranking logic
 */
export class TopicService {
	private aiProvider: IGenerativeAIProvider;
	private topicRepository: TopicRepository;

	constructor(
		aiProvider: IGenerativeAIProvider,
		topicRepository: TopicRepository,
	) {
		this.aiProvider = aiProvider;
		this.topicRepository = topicRepository;
	}

	/**
	 * Get topics for user, seeding with initial topics if none exist
	 * @param userId - User ID to get topics for
	 * @returns Array of available topics with question counts
	 */
	getOrSeedTopics(userId: string): TE.TaskEither<AppError, Topic[]> {
		return pipe(
			// Get existing topics for user
			this.topicRepository.getByUserId(userId, "available"),
			TE.flatMap((topics: Topic[]) => {
				// If no topics exist, seed with initial topics
				if (topics.length === 0) {
					Sentry.logger?.info?.("Seeding initial topics for new user", {
						user_id: userId,
						topic_count: INITIAL_TOPICS.length,
					});

					// Create all initial topics using functional composition
					const seedingTasks = INITIAL_TOPICS.map((initialTopic) =>
						this.topicRepository.create(
							userId,
							initialTopic.title,
							initialTopic.motivational_quote,
							initialTopic.questions,
							"available",
						),
					);

					return TE.sequenceArray(seedingTasks);
				}
				return TE.right(topics);
			}),
			TE.map((topics: readonly Topic[]) => {
				// Add question count to response
				return [...topics].map((topic) => ({
					...topic,
					questionCount: Array.isArray(topic.questions)
						? topic.questions.length
						: 0,
				}));
			}),
		);
	}

	/**
	 * Generate new topic candidates based on extracted interview data
	 * @param extractedFacts - The structured facts extracted from interview
	 * @param userId - User ID for personalization
	 * @returns Response with topic candidates and token usage
	 */
	generateTopicCandidates(
		extractedFacts: ExtractedFacts,
		userId: string,
	): TE.TaskEither<AppError, ModelResponse<Topic[]>> {
		Sentry.logger?.info?.("Topic generation started", {
			user_id: userId,
		});

		const context = this.buildFactsContext(extractedFacts);
		const prompt = fillTemplate(topicGenerationPrompt, { context: context });

		return pipe(
			this.aiProvider.generateCompletion(
				aiConfig.models.topicGeneration,
				topicSystemPrompt,
				prompt,
				undefined,
				0.5,
				2000,
				TopicCandidatesSchema,
			) as TE.TaskEither<AppError, ModelResponse<{ topics: Topic[] }>>,
			TE.map((generationResult: ModelResponse<{ topics: Topic[] }>) => {
				if (generationResult.data) {
					Sentry.logger?.info?.("Topic generation completed successfully", {
						user_id: userId,
						topicCount: generationResult.data?.topics.length || 0,
					});
				} else {
					Sentry.logger?.error?.("Topic generation returned no data", {
						user_id: userId,
						prompt: prompt,
					});
				}

				// Map generated topics to Topic domain model
				const newTopicsResult: Topic[] =
					generationResult.data?.topics.map(
						(topic) =>
							({
								...topic,
								user_id: userId,
								status: "available",
							}) as Topic,
					) || [];

				return {
					data: generationResult.data ? newTopicsResult : undefined,
					usage: generationResult.usage,
				};
			}),
			TE.mapLeft((error) => {
				Sentry.logger?.error?.("Topic generation failed", {
					user_id: userId,
					error: error instanceof Error ? error.message : String(error),
				});

				return error; // Already an AppError from provider
			}),
		);
	}

	/**
	 * Rerank all topics (new candidates + existing unused) by relevance
	 * @param newCandidates - Newly generated topic candidates
	 * @param existingTopics - All existing topics for the user
	 * @param extractedFacts - Current extraction context for ranking
	 * @param keepTopCount - Number of top topics to keep active (default: 5)
	 * @returns Response with active reranked topics and token usage
	 */
	rerankAllTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		extractedFacts: ExtractedFacts,
		keepTopCount: number = 5,
	): TE.TaskEither<AppError, ModelResponse<Topic[]>> {
		const zeroUsage = { inputTokens: 0, outputTokens: 0 } as Usage;

		// Filter only unused existing topics
		const unusedExisting = existingTopics.filter(
			(topic) => topic.status === "available",
		);

		// Combine new candidates with unused existing topics
		const allTopics = [...newCandidates, ...unusedExisting];

		// If no topics to rank, return empty array
		if (allTopics.length === 0) {
			return TE.right({
				data: [],
				usage: zeroUsage,
			});
		}

		// If only 1-5 topics, no need for complex ranking
		if (allTopics.length <= 5) {
			return TE.right({
				data: allTopics,
				usage: zeroUsage,
			});
		}

		return pipe(
			this.rerank(allTopics, extractedFacts),
			TE.map((rankResult) => {
				const rankedIndices = rankResult.data?.rankedIndices;

				// Validate and apply ranking
				const validIndices = rankedIndices
					? rankedIndices.filter(
							(index: number) => index >= 0 && index < allTopics.length,
						)
					: [];

				if (validIndices.length !== allTopics.length) {
					Sentry.logger?.warn?.(
						"Topic reranking returned invalid indices, using fallback",
						{
							expected: allTopics.length,
							received: validIndices.length,
						},
					);

					return {
						data: unusedExisting,
						usage: zeroUsage,
					};
				}

				const rerankedTopics = validIndices
					// sort topics by ranked indices
					.map((index: number) => allTopics[index])
					.filter((topic): topic is Topic => topic !== undefined)
					// set irrelevant status for topics not in top 5
					.map((topic, index) => ({
						...topic,
						status:
							index < keepTopCount
								? "available"
								: ("irrelevant" as TopicStatus),
					}))
					// filter out irrelevant topics without id, we are not persisting them
					.filter((topic) => topic.status !== "irrelevant" || topic.id);

				Sentry.logger?.info?.("Topics reranked successfully", {
					totalTopics: allTopics.length,
					newCandidates: newCandidates.length,
					existingTopics: unusedExisting.length,
				});

				return {
					data: rerankedTopics,
					usage: rankResult.usage,
				};
			}),
			TE.orElse((error) => {
				Sentry.logger?.error?.("Topic reranking failed", {
					newCandidatesCount: newCandidates.length,
					existingTopicsCount: existingTopics.length,
					error: error instanceof Error ? error.message : String(error),
				});

				// If reranking fails, return existing topics as fallback
				return TE.right({
					data: existingTopics,
					usage: zeroUsage,
				});
			}),
		);
	}

	private rerank(
		allTopics: Topic[],
		extractedFacts: ExtractedFacts,
	): TE.TaskEither<AppError, ModelResponse<TopicRanking>> {
		const context = this.buildFactsContext(extractedFacts);
		const topics_list = allTopics
			.map(
				(topic, index) =>
					`${index}: ${topic.title} - ${topic.motivational_quote}`,
			)
			.join("\n");
		const prompt = fillTemplate(topicRankingPrompt, {
			context: context,
			allTopics: topics_list,
			topic_amount: allTopics.length.toString(),
		});

		return this.aiProvider.generateCompletion(
			aiConfig.models.topicReranking,
			topicSystemPrompt,
			prompt,
			undefined,
			0.1,
			1000,
			TopicRankingSchema,
		);
	}

	private buildFactsContext(extractedFacts: ExtractedFacts): string {
		if (!extractedFacts) return "";

		const parts: string[] = [];

		if (extractedFacts.roles?.length > 0) {
			parts.push(
				`Roles: ${extractedFacts.roles
					.map((r) => `${r.title} at ${r.company}`)
					.join(", ")}`,
			);
		}

		if (extractedFacts.projects?.length > 0) {
			parts.push(
				`Projects: ${extractedFacts.projects.map((p) => p.name).join(", ")}`,
			);
		}

		if (extractedFacts.achievements?.length > 0) {
			parts.push(
				`Key Achievements: ${extractedFacts.achievements.length} recorded`,
			);
		}

		return parts.join("\n");
	}
}
