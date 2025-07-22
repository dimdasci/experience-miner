import { vi } from "vitest";
import type { ExtractedFacts } from "@/common/types/interview.js";

// Mock Gemini service responses
export const mockTranscriptionResponse = {
	text: "This is a test transcription of the audio file.",
};

export const mockExtractionResponse: ExtractedFacts = {
	summary: "Experienced software developer with 5+ years in web development.",
	companies: ["TechCorp", "StartupXYZ"],
	roles: [
		{
			title: "Senior Developer",
			company: "TechCorp",
			duration: "2021-Present",
		},
		{
			title: "Full Stack Developer",
			company: "StartupXYZ",
			duration: "2019-2021",
		},
	],
	projects: [
		{
			name: "E-commerce Platform",
			description: "Built scalable e-commerce solution serving 10k+ users",
			role: "Lead Developer",
		},
	],
	achievements: [
		"Reduced page load times by 40%",
		"Mentored 5 junior developers",
	],
	skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"],
};

// Mock GoogleGenAI class
export const createMockGoogleGenAI = () => ({
	models: {
		generateContent: vi.fn(),
	},
});

// Mock Gemini service
export const createMockGeminiService = () => ({
	transcribeAudio: vi.fn().mockResolvedValue(mockTranscriptionResponse.text),
	extractFacts: vi.fn().mockResolvedValue(mockExtractionResponse),
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
	response: Record<string, unknown>,
	success: boolean,
) => {
	expect(response).toHaveProperty("success", success);
	expect(response).toHaveProperty("message");
	expect(response).toHaveProperty("responseObject");
	expect(response).toHaveProperty("statusCode");
};

export const expectValidExtractedFacts = (facts: ExtractedFacts) => {
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
