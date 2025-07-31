import type { UsageMetadata } from "@google/genai";
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

export const TopicCandidatesSchema = z.object({
  topics: z.array(
    z.object({
      title: z.string().describe("The topic title"),
      motivational_quote: z.string().describe("A motivational quote for the topic"),
      questions: z.array(
        z.object({
          text: z.string().describe("The question text"),
          order: z.number().describe("The order of the question"),
        })
      ).describe("List of questions for the topic"),
    })
  ).describe("List of generated interview topics."),
}).describe("Root topic schema");

export type TopicCandidates = z.infer<typeof TopicCandidatesSchema>;

export const TopicRankingSchema = z.object({
  rankedIndices: z.array(z.number()).describe("Array of topic indices ranked by relevance"),
  reasoning: z.string().describe("Brief explanation of the ranking decisions"),
}).describe("Ranking response schema");

export type TopicRanking = z.infer<typeof TopicRankingSchema>;

// =====

// Extended interface for usage metadata with all possible properties
export interface ExtendedUsageMetadata extends UsageMetadata {
	candidatesTokenCount?: number;
}


// Generic AI response wrapper
export interface AIResponse<T> {
	data: T;
	usageMetadata?: ExtendedUsageMetadata;
}

// Topic service specific response wrapper
export interface TopicServiceResponse<T> {
	data: T;
	usageMetadata?: ExtendedUsageMetadata;
}

// AI Topic Question structure
export interface AITopicQuestion {
	text: string;
	order: number;
}

// AI Topic Response structure
export interface AITopicResponse {
	title: string;
	motivational_quote: string;
	questions: AITopicQuestion[];
}

// Topic Generation Response
export interface TopicGenerationResponse {
	topics: AITopicResponse[];
}

// Topic Reranking Response
export interface TopicRerankingResponse {
	rankedIndices: number[];
	reasoning: string;
}

// Extracted Facts structure for AI processing
export interface ExtractedFactsAI {
	achievements?: Array<{ description: string }>;
	companies?: Array<{ name: string }>;
	projects?: Array<{ name: string; description: string; role: string }>;
	roles?: Array<{ title: string; company: string; duration: string }>;
	skills?: Array<{ name: string }>;
	summary?: { text: string };
}
