export interface InterviewLog {
	q: string;
	a: string;
}

export interface Role {
	title: string;
	company: string;
	duration: string;
}

export interface Project {
	name: string;
	description: string;
	role: string;
}

export interface ExtractedFacts {
	summary: string;
	companies: string[];
	roles: Role[];
	projects: Project[];
	achievements: string[];
	skills: string[];
}

export type RecordingStatus = "idle" | "recording" | "paused" | "error";

export interface Topic {
	title: string;
	description: string;
	questions: string[];
}

export interface InterviewSession {
	id: string;
	userId: string;
	topicId: string;
	questions: InterviewLog[];
	status: "in_progress" | "completed" | "processed";
	createdAt: string;
	updatedAt: string;
}

export interface CareerFact {
	id: string;
	sessionId: string;
	userId: string;
	type: "company" | "role" | "project" | "achievement" | "skill";
	data: Record<string, unknown>;
	extractedAt: string;
}
