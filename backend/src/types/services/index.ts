// Credit system types
export interface CreditRecord {
	id: string;
	created_at: string;
	user_id: string;
	amount: number;
	source_amount: number;
	source_type: string;
	source_unit: string;
}

export type SourceType =
	| "welcome"
	| "transcriber"
	| "extractor"
	| "topic_generator"
	| "topic_ranker"
	| "purchase"
	| "promo";

// Service response wrapper
export interface ServiceResponse<T> {
	success: boolean;
	message: string;
	data: T | null;
	statusCode: number;
}

// Topic service specific types
export interface TopicServiceResponse<T> {
	data: T;
	usageMetadata?: {
		totalTokenCount?: number;
		candidatesTokenCount?: number;
		promptTokenCount?: number;
	};
}

// Topic workflow result
export interface TopicWorkflowResult {
	topics: Array<{
		id?: number;
		title: string;
		motivational_quote: string;
		questions: Array<{ text: string; order: number }>;
		status: "available" | "used" | "irrelevant";
	}>;
	generationTokens: number;
	rerankingTokens: number;
}
