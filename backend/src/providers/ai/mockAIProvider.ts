import type { IAIProvider } from "@/interfaces/providers/index.js";
import type { AIResponse } from "@/types/ai/index.js";
import type { Topic } from "@/types/database/index.js";
import type { ExtractedFacts } from "@/types/extractedFacts.js";

/**
 * Mock AI Provider for testing and development
 * Returns predictable responses without external API calls
 */
export class MockAIProvider implements IAIProvider {
	private shouldFail: boolean;
	private responses: Map<string, unknown>;

	constructor(shouldFail = false) {
		this.shouldFail = shouldFail;
		this.responses = new Map();
	}

	/**
	 * Set custom response for a specific operation
	 */
	setResponse(operation: string, response: unknown): void {
		this.responses.set(operation, response);
	}

	/**
	 * Configure provider to simulate failures
	 */
	setShouldFail(shouldFail: boolean): void {
		this.shouldFail = shouldFail;
	}

	async transcribeAudio(
		audioBuffer: Buffer,
		mimeType: string,
	): Promise<AIResponse<string>> {
		if (this.shouldFail) {
			throw new Error("Mock AI transcription failure");
		}

		const customResponse = this.responses.get("transcribe");
		if (customResponse) {
			return customResponse as AIResponse<string>;
		}

		// Default mock transcription
		const transcript = `This is a mock transcription of audio with length ${audioBuffer.length} bytes and mime type ${mimeType}. The speaker discussed their experience working on various projects and achievements.`;

		return {
			data: transcript,
			usageMetadata: {
				totalTokenCount: 100,
				promptTokenCount: 10,
				candidatesTokenCount: 90,
			},
		};
	}

	async extractFacts(
		_transcript: string,
		interviewId: string,
	): Promise<AIResponse<ExtractedFacts>> {
		if (this.shouldFail) {
			throw new Error("Mock AI fact extraction failure");
		}

		const customResponse = this.responses.get("extract");
		if (customResponse) {
			return customResponse as AIResponse<ExtractedFacts>;
		}

		// Default mock extraction
		const facts: ExtractedFacts = {
			summary: {
				text: "Mock professional summary based on the interview transcript",
				lastUpdated: new Date().toISOString(),
				basedOnInterviews: [interviewId],
			},
			companies: [
				{
					name: "Mock Corporation",
					sourceInterviewId: interviewId,
					sourceQuestionNumber: 1,
					extractedAt: new Date().toISOString(),
				},
			],
			roles: [
				{
					title: "Senior Mock Developer",
					company: "Mock Corporation",
					duration: "2 years",
					sourceInterviewId: interviewId,
					sourceQuestionNumber: 1,
					extractedAt: new Date().toISOString(),
				},
			],
			projects: [
				{
					name: "Mock Project Alpha",
					description: "A comprehensive mock project for testing purposes",
					role: "Lead Developer",
					company: "Mock Corporation",
					sourceInterviewId: interviewId,
					sourceQuestionNumber: 2,
					extractedAt: new Date().toISOString(),
				},
			],
			achievements: [
				{
					description: "Increased mock metrics by 50%",
					sourceInterviewId: interviewId,
					sourceQuestionNumber: 3,
					extractedAt: new Date().toISOString(),
				},
			],
			skills: [
				{
					name: "Mock Programming",
					category: "Technical",
					sourceInterviewId: interviewId,
					sourceQuestionNumber: 1,
					extractedAt: new Date().toISOString(),
				},
				{
					name: "Mock Leadership",
					category: "Soft Skills",
					sourceInterviewId: interviewId,
					sourceQuestionNumber: 2,
					extractedAt: new Date().toISOString(),
				},
			],
			metadata: {
				totalExtractions: 1,
				lastExtractionAt: new Date().toISOString(),
				creditsUsed: 200,
			},
		};

		return {
			data: facts,
			usageMetadata: {
				totalTokenCount: 200,
				promptTokenCount: 50,
				candidatesTokenCount: 150,
			},
		};
	}

	async generateTopics(
		_extractedFacts: ExtractedFacts,
		_userId: string,
	): Promise<AIResponse<Topic[]>> {
		if (this.shouldFail) {
			throw new Error("Mock AI topic generation failure");
		}

		const customResponse = this.responses.get("generateTopics");
		if (customResponse) {
			return customResponse as AIResponse<Topic[]>;
		}

		// Default mock topics
		const topics: Partial<Topic>[] = [
			{
				title: "Mock Technical Deep Dive",
				motivational_quote: "Every expert was once a beginner.",
				questions: [
					{
						text: "What was your most challenging technical project?",
						order: 1,
					},
					{ text: "How did you approach solving complex problems?", order: 2 },
					{ text: "What technologies did you learn on the job?", order: 3 },
				],
				status: "available" as const,
			},
			{
				title: "Mock Leadership Experience",
				motivational_quote:
					"Leadership is not about being in charge, it's about taking care of those in your charge.",
				questions: [
					{
						text: "Describe a time you led a team through difficulty?",
						order: 1,
					},
					{ text: "How do you motivate team members?", order: 2 },
					{ text: "What's your approach to delegation?", order: 3 },
				],
				status: "available" as const,
			},
		];

		return {
			data: topics as Topic[],
			usageMetadata: {
				totalTokenCount: 150,
				promptTokenCount: 30,
				candidatesTokenCount: 120,
			},
		};
	}

	async rankTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		_extractedFacts: ExtractedFacts,
	): Promise<AIResponse<number[]>> {
		if (this.shouldFail) {
			throw new Error("Mock AI topic ranking failure");
		}

		const customResponse = this.responses.get("rankTopics");
		if (customResponse) {
			return customResponse as AIResponse<number[]>;
		}

		// Default mock ranking (simply return indices in order)
		const allTopics = [...newCandidates, ...existingTopics];
		const rankedIndices = Array.from({ length: allTopics.length }, (_, i) => i);

		return {
			data: rankedIndices,
			usageMetadata: {
				totalTokenCount: 75,
				promptTokenCount: 25,
				candidatesTokenCount: 50,
			},
		};
	}
}
