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
