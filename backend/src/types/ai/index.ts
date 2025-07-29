import type { UsageMetadata } from "@google/genai";

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
