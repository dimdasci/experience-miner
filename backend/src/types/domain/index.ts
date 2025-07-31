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
	id: string;
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

export interface Achievement {
	description: string;
	sourceInterviewId: string;
	sourceQuestionNumber: number;
	extractedAt: string;
}

export interface Company {
	name: string;
	sourceInterviewId: string;
	sourceQuestionNumber: number;
	extractedAt: string;
}

export interface Project {
	name: string;
	description: string;
	role: string;
	company?: string;
	sourceInterviewId: string;
	sourceQuestionNumber: number;
	extractedAt: string;
}

export interface Role {
	title: string;
	company: string;
	duration: string; // flexible format
	sourceInterviewId: string;
	sourceQuestionNumber: number;
	extractedAt: string;
}

export interface Skill {
	name: string;
	category?: string; // optional: technical, leadership, etc.
	sourceInterviewId: string;
	sourceQuestionNumber: number;
	extractedAt: string;
}




