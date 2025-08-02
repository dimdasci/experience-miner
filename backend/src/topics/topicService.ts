import * as Sentry from "@sentry/node";
import { aiConfig } from "@/config";
import {
	topicGenerationPrompt,
	topicRankingPrompt,
	topicSystemPrompt,
} from "@/constants/topicPrompts";
import type { ExtractedFacts } from "@/experience/types";
import type {
	IGenerativeAIProvider,
	ModelResponse,
	Usage,
} from "@/providers/ai";
import { fillTemplate } from "@/utils";
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

	constructor(aiProvider: IGenerativeAIProvider) {
		this.aiProvider = aiProvider;
	}

	/**
	 * Generate new topic candidates based on extracted interview data
	 * @param extractedFacts - The structured facts extracted from interview
	 * @param userId - User ID for personalization
	 * @returns Response with topic candidates and token usage
	 */
	async generateTopicCandidates(
		extractedFacts: ExtractedFacts,
		userId: string,
	): Promise<ModelResponse<Topic[]>> {
		try {
			Sentry.logger?.info?.("Topic generation started", {
				user_id: userId,
			});

			const context = this.buildFactsContext(extractedFacts);
			const prompt = fillTemplate(topicGenerationPrompt, { context: context });

			const generationResult = await this.aiProvider.generateCompletion(
				aiConfig.models.topicGeneration,
				topicSystemPrompt,
				prompt,
				undefined,
				0.5,
				2000,
				TopicCandidatesSchema,
			);

			if (!generationResult.data) {
				Sentry.logger?.error?.("Topic generation returned no data", {
					user_id: userId,
					prompt: prompt,
				});
			} else {
				Sentry.logger?.info?.("Topic generation completed successfully", {
					user_id: userId,
					topicCount: generationResult.data?.topics.length || 0,
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
		} catch (error) {
			Sentry.captureException(error, {
				tags: { endpoint: "topic_generation", status: "error" },
				contexts: {
					user: { id: userId },
				},
			});

			Sentry.logger?.error?.("Topic generation failed", {
				user_id: userId,
				error: error instanceof Error ? error.message : String(error),
			});

			return { data: [], usage: { inputTokens: 0, outputTokens: 0 } };
		}
	}

	/**
	 * Rerank all topics (new candidates + existing unused) by relevance
	 * @param newCandidates - Newly generated topic candidates
	 * @param existingTopics - All existing topics for the user
	 * @param extractedFacts - Current extraction context for ranking
	 * @param keepTopCount - Number of top topics to keep active (default: 5)
	 * @returns Response with active reranked topics and token usage
	 */
	async rerankAllTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		extractedFacts: ExtractedFacts,
		keepTopCount: number = 5,
	): Promise<ModelResponse<Topic[]>> {
		const zeroUsage = { inputTokens: 0, outputTokens: 0 } as Usage;

		// Filter only unused existing topics
		const unusedExisting = existingTopics.filter(
			(topic) => topic.status === "available",
		);

		// Combine new candidates with unused existing topics
		const allTopics = [...newCandidates, ...unusedExisting];

		// If no topics to rank, return empty array
		if (allTopics.length === 0) {
			return {
				data: [],
				usage: zeroUsage,
			};
		}

		// If only 1-5 topics, no need for complex ranking
		if (allTopics.length <= 5) {
			return {
				data: allTopics,
				usage: zeroUsage,
			};
		}

		try {
			// Use aiProvider.rankTopics to get ranked indices
			const rankResult = await this.rerank(allTopics, extractedFacts);

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
						index < keepTopCount ? "available" : ("irrelevant" as TopicStatus),
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
		} catch (error) {
			Sentry.captureException(error, {
				tags: { service: "topic", operation: "reranking" },
				contexts: {
					request: {
						newCandidatesCount: newCandidates.length,
						existingTopicsCount: existingTopics.length,
					},
				},
			});

			Sentry.logger?.error?.("Topic reranking failed", {
				newCandidatesCount: newCandidates.length,
				existingTopicsCount: existingTopics.length,
				error: error instanceof Error ? error.message : String(error),
			});

			// If reranking fails, return existing topics as fallback
			return {
				data: existingTopics,
				usage: zeroUsage,
			};
		}
	}

	private async rerank(
		allTopics: Topic[],
		extractedFacts: ExtractedFacts,
	): Promise<ModelResponse<TopicRanking>> {
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

		return await this.aiProvider.generateCompletion(
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
