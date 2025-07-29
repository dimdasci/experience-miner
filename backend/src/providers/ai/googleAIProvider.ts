import { Type } from "@google/genai";
import * as Sentry from "@sentry/node";
import { geminiConnection } from "@/common/connections/geminiConnection.js";
import type { IAIProvider } from "@/interfaces/providers/index.js";
import type { ExtractedFacts } from "@/services/transcribeService.js";
import type { AIResponse, ExtractedUsageMetadata } from "@/types/ai/index.js";
import type { Topic } from "@/types/database/index.js";

type ExtendedUsageMetadata = ExtractedUsageMetadata & {
	totalTokenCount?: number;
};

/**
 * Google AI Provider implementation using Gemini models
 * Handles transcription, fact extraction, topic generation, and topic ranking
 */
export class GoogleAIProvider implements IAIProvider {
	async transcribeAudio(
		audioBuffer: Buffer,
		mimeType: string,
	): Promise<AIResponse<string>> {
		try {
			const base64Audio = audioBuffer.toString("base64");

			const audioPart = {
				inlineData: {
					mimeType,
					data: base64Audio,
				},
			};

			const request = {
				model: "gemini-2.5-flash", // Use model from connection manager
				contents: [
					{
						parts: [
							{
								text: "Transcribe the following audio recording clearly and accurately. Clean up any language issues but keep the speaker style intact.",
							},
							audioPart,
						],
					},
				],
			};

			const result = await geminiConnection.generateContent(request);
			const usageMetadata = result.usageMetadata as ExtendedUsageMetadata;

			const transcript = result.text?.trim();
			if (!transcript) {
				throw new Error("Empty transcription result from AI");
			}

			Sentry.logger?.info?.("Audio transcription completed", {
				transcriptLength: transcript.length,
				tokensUsed: usageMetadata?.totalTokenCount || 0,
			});

			return {
				data: transcript,
				usageMetadata,
			};
		} catch (error) {
			Sentry.captureException(error, {
				tags: { provider: "google", operation: "transcribe" },
			});

			throw new Error(
				`Google AI transcription failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	async extractFacts(
		transcript: string,
		interviewId: string,
	): Promise<AIResponse<ExtractedFacts>> {
		try {
			const extractionSchema = Type.object({
				summary: Type.string(),
				companies: Type.array(
					Type.object({
						name: Type.string(),
						sourceQuestionNumber: Type.number(),
					}),
				),
				roles: Type.array(
					Type.object({
						title: Type.string(),
						company: Type.string(),
						duration: Type.string(),
						sourceQuestionNumber: Type.number(),
					}),
				),
				projects: Type.array(
					Type.object({
						name: Type.string(),
						description: Type.string(),
						role: Type.string(),
						company: Type.optional(Type.string()),
						sourceQuestionNumber: Type.number(),
					}),
				),
				achievements: Type.array(
					Type.object({
						description: Type.string(),
						sourceQuestionNumber: Type.number(),
					}),
				),
				skills: Type.array(
					Type.object({
						name: Type.string(),
						category: Type.optional(Type.string()),
						sourceQuestionNumber: Type.number(),
					}),
				),
			});

			const prompt = `Extract structured career information from this interview transcript. Focus on concrete facts and experiences only.

Interview Transcript:
${transcript}

Requirements:
- Extract companies, roles, projects, achievements, and skills mentioned
- Include sourceQuestionNumber for each item (extract from <question number=X> tags)
- For achievements: focus on quantifiable results, impact, recognition
- For skills: include both technical and soft skills explicitly mentioned
- For projects: include name, description, your role, and company if mentioned
- For roles: include title, company, and duration if mentioned
- Generate a brief professional summary paragraph
- Exclude workplace conflicts, reasons for leaving, or sensitive topics
- Only include information explicitly stated in the transcript`;

			const request = {
				model: "gemini-2.5-flash",
				contents: [
					{
						parts: [{ text: prompt }],
					},
				],
				generation_config: {
					response_schema: extractionSchema,
					response_mime_type: "application/json",
				},
			};

			const result = await geminiConnection.generateContent(request);
			const usageMetadata = result.usageMetadata as ExtendedUsageMetadata;

			if (!result.text) {
				throw new Error("Empty extraction result from AI");
			}

			const extractedData = JSON.parse(result.text);

			Sentry.logger?.info?.("Fact extraction completed", {
				interviewId,
				tokensUsed: usageMetadata?.totalTokenCount || 0,
				extractedCounts: {
					companies: extractedData.companies?.length || 0,
					roles: extractedData.roles?.length || 0,
					projects: extractedData.projects?.length || 0,
					achievements: extractedData.achievements?.length || 0,
					skills: extractedData.skills?.length || 0,
				},
			});

			return {
				data: extractedData,
				usageMetadata,
			};
		} catch (error) {
			Sentry.captureException(error, {
				tags: { provider: "google", operation: "extract" },
				contexts: { interview: { id: interviewId } },
			});

			throw new Error(
				`Google AI fact extraction failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	async generateTopics(
		extractedFacts: any,
		userId: string,
	): Promise<AIResponse<Topic[]>> {
		try {
			// Build context from extracted facts
			const context = this.buildFactsContext(extractedFacts);
			if (!context.trim()) {
				Sentry.logger?.warn?.(
					"No facts context available for topic generation",
					{
						userId,
					},
				);
				return {
					data: [],
					usageMetadata: { totalTokenCount: 0 },
				};
			}

			const topicSchema = Type.object({
				topics: Type.array(
					Type.object({
						title: Type.string(),
						motivational_quote: Type.string(),
						questions: Type.array(
							Type.object({
								text: Type.string(),
								order: Type.number(),
							}),
						),
					}),
				),
			});

			const prompt = `Based on the following career information, generate 3-5 new interview topics that would help extract additional valuable career details.

Career Context:
${context}

Requirements:
- Generate topics that complement existing information
- Each topic should have 4-6 specific, open-ended questions
- Focus on concrete experiences, projects, skills, and achievements
- Avoid personal relationships, conflicts, or reasons for leaving jobs
- Questions should encourage detailed storytelling
- Include a motivational quote for each topic
- Number questions starting from 1 for each topic

Generate topics that would uncover valuable career information not already covered.`;

			const request = {
				model: "gemini-2.5-flash",
				contents: [{ parts: [{ text: prompt }] }],
				generation_config: {
					response_schema: topicSchema,
					response_mime_type: "application/json",
				},
			};

			const result = await geminiConnection.generateContent(request);
			const usageMetadata = result.usageMetadata as ExtendedUsageMetadata;

			if (!result.text) {
				return {
					data: [],
					usageMetadata,
				};
			}

			const response = JSON.parse(result.text);
			const topics = response.topics || [];

			Sentry.logger?.info?.("Topic generation completed", {
				userId,
				topicsGenerated: topics.length,
				tokensUsed: usageMetadata?.totalTokenCount || 0,
			});

			return {
				data: topics,
				usageMetadata,
			};
		} catch (error) {
			Sentry.captureException(error, {
				tags: { provider: "google", operation: "generate_topics" },
				contexts: { user: { id: userId } },
			});

			throw new Error(
				`Google AI topic generation failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	async rankTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		extractedFacts: any,
	): Promise<AIResponse<number[]>> {
		try {
			if (newCandidates.length === 0) {
				return {
					data: [],
					usageMetadata: { totalTokenCount: 0 },
				};
			}

			const context = this.buildFactsContext(extractedFacts);
			const unusedExisting = existingTopics.filter(
				(topic) => topic.status === "available",
			);

			const allTopics = [...newCandidates, ...unusedExisting];

			const rankingSchema = Type.object({
				rankedIndices: Type.array(Type.number()),
				reasoning: Type.string(),
			});

			const prompt = `Rank these interview topics by relevance to extracting valuable career information based on the user's background.

User's Career Context:
${context}

Topics to rank:
${allTopics
	.map(
		(topic, index) => `${index}: ${topic.title} - ${topic.motivational_quote}`,
	)
	.join("\n")}

Requirements:
- Return indices of topics ranked by potential value (most valuable first)
- Consider diversity - avoid too many similar topics
- Prioritize topics that would reveal new information
- Include all ${allTopics.length} topic indices in the ranking
- Provide brief reasoning for the ranking decisions`;

			const request = {
				model: "gemini-2.5-flash",
				contents: [{ parts: [{ text: prompt }] }],
				generation_config: {
					response_schema: rankingSchema,
					response_mime_type: "application/json",
				},
			};

			const result = await geminiConnection.generateContent(request);
			const usageMetadata = result.usageMetadata as ExtendedUsageMetadata;

			if (!result.text) {
				// Return original order as fallback
				return {
					data: Array.from({ length: allTopics.length }, (_, i) => i),
					usageMetadata,
				};
			}

			const response = JSON.parse(result.text);
			const rankedIndices = response.rankedIndices || [];

			Sentry.logger?.info?.("Topic ranking completed", {
				totalTopics: allTopics.length,
				tokensUsed: usageMetadata?.totalTokenCount || 0,
				reasoning: response.reasoning,
			});

			return {
				data: rankedIndices,
				usageMetadata,
			};
		} catch (error) {
			Sentry.captureException(error, {
				tags: { provider: "google", operation: "rank_topics" },
			});

			// Return original order as fallback
			const fallbackIndices = Array.from(
				{ length: newCandidates.length + existingTopics.length },
				(_, i) => i,
			);

			return {
				data: fallbackIndices,
				usageMetadata: { totalTokenCount: 0 },
			};
		}
	}

	private buildFactsContext(extractedFacts: any): string {
		if (!extractedFacts) return "";

		const parts: string[] = [];

		if (extractedFacts.companies?.length > 0) {
			parts.push(
				`Companies: ${extractedFacts.companies.map((c: any) => c.name).join(", ")}`,
			);
		}

		if (extractedFacts.roles?.length > 0) {
			parts.push(
				`Roles: ${extractedFacts.roles
					.map((r: any) => `${r.title} at ${r.company}`)
					.join(", ")}`,
			);
		}

		if (extractedFacts.projects?.length > 0) {
			parts.push(
				`Projects: ${extractedFacts.projects.map((p: any) => p.name).join(", ")}`,
			);
		}

		if (extractedFacts.skills?.length > 0) {
			parts.push(
				`Skills: ${extractedFacts.skills.map((s: any) => s.name).join(", ")}`,
			);
		}

		if (extractedFacts.achievements?.length > 0) {
			parts.push(
				`Key Achievements: ${extractedFacts.achievements.length} recorded`,
			);
		}

		return parts.join("\n");
	}
}
