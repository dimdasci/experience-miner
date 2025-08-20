import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import {
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
import type { Topic, TopicRanking, TopicStatus } from "@/topics/types";
import { TopicRankingSchema } from "@/topics/types";
import { fillTemplate } from "@/utils";
import { buildFactsContext } from "./contextBuilder";

/**
 * Handles the topic generation
 */
export class rerankTopicsFlow {
	private aiProvider: IGenerativeAIProvider;

	constructor(aiProvider: IGenerativeAIProvider) {
		this.aiProvider = aiProvider;
	}

	/**
	 * Rerank all topics (new candidates + existing unused) by relevance
	 * @param newCandidates - Newly generated topic candidates
	 * @param existingTopics - All existing topics for the user
	 * @param extractedFacts - Current extraction context for ranking
	 * @param keepTopCount - Number of top topics to keep active (default: 5)
	 * @returns Response with active reranked topics and token usage
	 */
	execute(
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
		const context = buildFactsContext(extractedFacts);
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
			"topicReranking",
			topicSystemPrompt,
			prompt,
			undefined,
			TopicRankingSchema,
		);
	}
}
