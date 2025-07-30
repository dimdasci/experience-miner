import { vi } from "vitest";
import type { ExtractedFacts } from "@/types/extractedFacts.js";

// Define the raw types returned by Gemini without the metadata fields
interface RawCompany {
	name: string;
	sourceQuestionNumber: number;
}

interface RawRole {
	title: string;
	company: string;
	duration: string;
	sourceQuestionNumber: number;
}

interface RawProject {
	name: string;
	description: string;
	role: string;
	company?: string;
	sourceQuestionNumber: number;
}

interface RawAchievement {
	description: string;
	sourceQuestionNumber: number;
}

interface RawSkill {
	name: string;
	category?: string;
	sourceQuestionNumber: number;
}

// Define the structure of the raw Gemini response
export interface RawGeminiResponse {
	summary: string;
	companies: RawCompany[];
	roles: RawRole[];
	projects: RawProject[];
	achievements: RawAchievement[];
	skills: RawSkill[];
}

// Mock Gemini service responses
export const mockTranscriptionResponse = {
	text: "This is a test transcription of the audio file.",
};

// This represents the raw response from Gemini without metadata
export const mockRawGeminiResponse: RawGeminiResponse = {
	summary: "Experienced software developer with 5+ years in web development.",
	companies: [
		{
			name: "TechCorp",
			sourceQuestionNumber: 1,
		},
		{
			name: "StartupXYZ",
			sourceQuestionNumber: 1,
		},
	],
	roles: [
		{
			title: "Senior Developer",
			company: "TechCorp",
			duration: "2021-Present",
			sourceQuestionNumber: 1,
		},
		{
			title: "Full Stack Developer",
			company: "StartupXYZ",
			duration: "2019-2021",
			sourceQuestionNumber: 1,
		},
	],
	projects: [
		{
			name: "E-commerce Platform",
			description: "Built scalable e-commerce solution serving 10k+ users",
			role: "Lead Developer",
			sourceQuestionNumber: 1,
		},
	],
	achievements: [
		{
			description: "Reduced page load times by 40%",
			sourceQuestionNumber: 1,
		},
		{
			description: "Mentored 5 junior developers",
			sourceQuestionNumber: 1,
		},
	],
	skills: [
		{
			name: "JavaScript",
			sourceQuestionNumber: 1,
		},
		{
			name: "TypeScript",
			sourceQuestionNumber: 1,
		},
		{
			name: "React",
			sourceQuestionNumber: 1,
		},
		{
			name: "Node.js",
			sourceQuestionNumber: 1,
		},
		{
			name: "PostgreSQL",
			sourceQuestionNumber: 1,
		},
	],
};

// This represents the final processed response after the router adds metadata
export const mockExtractionResponse: ExtractedFacts = {
	summary: {
		text: "Experienced software developer with 5+ years in web development.",
		lastUpdated: new Date().toISOString(),
		basedOnInterviews: ["1"],
	},
	companies: [
		{
			name: "TechCorp",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			name: "StartupXYZ",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
	],
	roles: [
		{
			title: "Senior Developer",
			company: "TechCorp",
			duration: "2021-Present",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			title: "Full Stack Developer",
			company: "StartupXYZ",
			duration: "2019-2021",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
	],
	projects: [
		{
			name: "E-commerce Platform",
			description: "Built scalable e-commerce solution serving 10k+ users",
			role: "Lead Developer",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
	],
	achievements: [
		{
			description: "Reduced page load times by 40%",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			description: "Mentored 5 junior developers",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
	],
	skills: [
		{
			name: "JavaScript",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			name: "TypeScript",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			name: "React",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			name: "Node.js",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
		{
			name: "PostgreSQL",
			sourceInterviewId: "1",
			sourceQuestionNumber: 1,
			extractedAt: new Date().toISOString(),
		},
	],
	metadata: {
		totalExtractions: 1,
		lastExtractionAt: new Date().toISOString(),
		creditsUsed: 100,
	},
};

// Mock GoogleGenAI class
export const createMockGoogleGenAI = () => ({
	models: {
		generateContent: vi.fn(),
	},
});

// Mock Gemini service
export const createMockGeminiService = () => ({
	transcribeAudio: vi.fn().mockResolvedValue({
		data: mockTranscriptionResponse.text,
		usageMetadata: { totalTokenCount: 100 },
	}),
	extractFacts: vi.fn().mockResolvedValue({
		data: mockRawGeminiResponse,
		usageMetadata: { totalTokenCount: 200 },
	}),
});

// Test data generators
export const createTestTranscript = () => `
I worked at TechCorp as a Senior Developer for about 2 years now. 
Before that, I was at StartupXYZ as a Full Stack Developer for 2 years.
I built an e-commerce platform that serves over 10,000 users.
I'm skilled in JavaScript, TypeScript, React, Node.js, and PostgreSQL.
I've reduced page load times by 40% and mentored 5 junior developers.
`;

export const createTestAudioBuffer = () => Buffer.from("mock audio data");

// Assertion helpers
export const expectServiceResponse = (
	response: {
		success: boolean;
		message: string;
		responseObject: unknown;
		statusCode: number;
	},
	success: boolean,
) => {
	expect(response).toHaveProperty("success", success);
	expect(response).toHaveProperty("message");
	expect(response).toHaveProperty("responseObject");
	expect(response).toHaveProperty("statusCode");
};

export const expectValidExtractedFacts = (
	facts: ExtractedFacts | RawGeminiResponse,
) => {
	expect(facts).toHaveProperty("summary");
	expect(facts).toHaveProperty("companies");
	expect(facts).toHaveProperty("roles");
	expect(facts).toHaveProperty("projects");
	expect(facts).toHaveProperty("achievements");
	expect(facts).toHaveProperty("skills");

	expect(Array.isArray(facts.companies)).toBe(true);
	expect(Array.isArray(facts.roles)).toBe(true);
	expect(Array.isArray(facts.projects)).toBe(true);
	expect(Array.isArray(facts.achievements)).toBe(true);
	expect(Array.isArray(facts.skills)).toBe(true);
};
