import { z } from "zod";

export interface Usage {
	inputTokens: number;
	outputTokens: number;
}

export interface ModelResponse<T> {
	data?: T;
	usage: Usage;
}

export interface MediaData {
	mimeType: string;
	data: Buffer;
}

/**
 * Schemas and types for structured generation
 */

export const TopicCandidatesSchema = z
	.object({
		topics: z
			.array(
				z.object({
					title: z.string().describe("The topic title"),
					motivational_quote: z
						.string()
						.describe("A motivational quote for the topic"),
					questions: z
						.array(
							z.object({
								text: z.string().describe("The question text"),
								order: z.number().describe("The order of the question"),
							}),
						)
						.describe("List of questions for the topic"),
				}),
			)
			.describe("List of generated interview topics."),
	})
	.describe("Root topic schema");

export type TopicCandidates = z.infer<typeof TopicCandidatesSchema>;

export const TopicRankingSchema = z
	.object({
		rankedIndices: z
			.array(z.number())
			.describe("Array of topic indices ranked by relevance"),
		reasoning: z
			.string()
			.describe("Brief explanation of the ranking decisions"),
	})
	.describe("Ranking response schema");

export type TopicRanking = z.infer<typeof TopicRankingSchema>;
