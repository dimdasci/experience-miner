import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import {
	topicGenerationPrompt,
	topicSystemPrompt,
} from "@/constants/topicPrompts";
import type { AppError } from "@/errors";
import type { ExtractedFacts } from "@/experience/types";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import type { Topic } from "@/topics/types";
import { TopicCandidatesSchema } from "@/topics/types";
import { fillTemplate } from "@/utils";
import { buildFactsContext } from "./contextBuilder";

/**
 * Handles the topic generation
 */
export class generateTopicsFlow {
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
	execute(
		extractedFacts: ExtractedFacts,
		userId: string,
	): TE.TaskEither<AppError, ModelResponse<Topic[]>> {
		Sentry.logger?.info?.("Topic generation started", {
			user_id: userId,
		});

		const context = buildFactsContext(extractedFacts);
		const prompt = fillTemplate(topicGenerationPrompt, { context: context });

		return pipe(
			this.aiProvider.generateCompletion(
				"topicGeneration",
				topicSystemPrompt,
				prompt,
				undefined,
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
}
