import { z } from "zod";

/**
 * Topic domain types
 */

// Database entity types
export interface Topic {
	id?: number; // Optional - only set after database persistence
	user_id: string;
	title: string;
	motivational_quote: string;
	questions: TopicQuestion[];
	status: TopicStatus;
	created_at: string;
	updated_at: string;
}

export interface TopicQuestion {
	text: string;
	order: number;
}

export type TopicStatus = "available" | "used" | "irrelevant";

// Generation and ranking schemas
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
