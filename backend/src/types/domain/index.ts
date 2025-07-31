// Database entity types for Experience Miner

import type { ExtractedFacts } from "../extractedFacts.js";

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

export interface Interview {
	id: number;
	user_id: string;
	title: string;
	motivational_quote: string;
	status: InterviewStatus;
	created_at: string;
	updated_at: string;
}

export type InterviewStatus = "draft" | "completed";

export interface Answer {
	id: number;
	interview_id: number;
	user_id: string;
	question_number: number;
	question: string;
	answer: string | null;
	recording_duration_seconds: number | null;
	created_at: string;
	updated_at: string;
}

export interface ExperienceRecord {
	user_id: string;
	payload: ExtractedFacts;
	updated_at: string;
}




