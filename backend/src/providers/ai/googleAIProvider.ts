import { Type } from "@google/genai";
import * as Sentry from "@sentry/node";
import { geminiConnection } from "@/common/connections/geminiConnection.js";
import type { IAIProvider } from "@/interfaces/providers/index.js";
import type { ExtractedFacts } from "@/types/extractedFacts.js";
import type { AIResponse, ExtendedUsageMetadata } from "@/types/ai/index.js";
import type { Topic } from "@/types/database/index.js";

// Remove duplicate type definition - use the one from types/ai/index.ts

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
			const extractionSchema = {
				type: Type.OBJECT,
				properties: {
					summary: {
						type: Type.STRING,
						description:
							"A 2-3 sentence professional summary of the user's experience based on the interview.",
					},
					companies: {
						type: Type.ARRAY,
						description: "List of unique companies the user has worked for.",
						items: {
							type: Type.OBJECT,
							properties: {
								name: { type: Type.STRING },
								sourceQuestionNumber: {
									type: Type.NUMBER,
									description:
										"The question number from the transcript where this information was found",
								},
							},
							required: ["name", "sourceQuestionNumber"],
						},
					},
					roles: {
						type: Type.ARRAY,
						description: "List of roles/positions the user has held.",
						items: {
							type: Type.OBJECT,
							properties: {
								title: { type: Type.STRING },
								company: { type: Type.STRING },
								duration: { type: Type.STRING },
								sourceQuestionNumber: {
									type: Type.NUMBER,
									description:
										"The question number from the transcript where this information was found",
								},
							},
							required: [
								"title",
								"company",
								"duration",
								"sourceQuestionNumber",
							],
						},
					},
					projects: {
						type: Type.ARRAY,
						description: "List of projects the user has worked on.",
						items: {
							type: Type.OBJECT,
							properties: {
								name: { type: Type.STRING },
								description: { type: Type.STRING },
								role: { type: Type.STRING },
								company: {
									type: Type.STRING,
									description:
										"Optional company name associated with this project",
								},
								sourceQuestionNumber: {
									type: Type.NUMBER,
									description:
										"The question number from the transcript where this information was found",
								},
							},
							required: ["name", "description", "role", "sourceQuestionNumber"],
						},
					},
					achievements: {
						type: Type.ARRAY,
						description: "List of notable achievements and accomplishments.",
						items: {
							type: Type.OBJECT,
							properties: {
								description: { type: Type.STRING },
								sourceQuestionNumber: {
									type: Type.NUMBER,
									description:
										"The question number from the transcript where this information was found",
								},
							},
							required: ["description", "sourceQuestionNumber"],
						},
					},
					skills: {
						type: Type.ARRAY,
						description: "List of skills mentioned by the user.",
						items: {
							type: Type.OBJECT,
							properties: {
								name: { type: Type.STRING },
								category: {
									type: Type.STRING,
									description:
										"Optional category like 'technical', 'leadership', etc.",
								},
								sourceQuestionNumber: {
									type: Type.NUMBER,
									description:
										"The question number from the transcript where this information was found",
								},
							},
							required: ["name", "sourceQuestionNumber"],
						},
					},
				},
				required: [
					"summary",
					"companies",
					"roles",
					"projects",
					"achievements",
					"skills",
				],
			};

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
		extractedFacts: ExtractedFacts,
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

			const topicSchema = {
				type: Type.OBJECT,
				properties: {
					topics: {
						type: Type.ARRAY,
						description: "List of generated interview topics.",
						items: {
							type: Type.OBJECT,
							properties: {
								title: {
									type: Type.STRING,
									description: "The topic title",
								},
								motivational_quote: {
									type: Type.STRING,
									description: "A motivational quote for the topic",
								},
								questions: {
									type: Type.ARRAY,
									description: "List of questions for the topic",
									items: {
										type: Type.OBJECT,
										properties: {
											text: {
												type: Type.STRING,
												description: "The question text",
											},
											order: {
												type: Type.NUMBER,
												description: "The order of the question",
											},
										},
										required: ["text", "order"],
									},
								},
							},
							required: ["title", "motivational_quote", "questions"],
						},
					},
				},
				required: ["topics"],
			};

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
		extractedFacts: ExtractedFacts,
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

			const rankingSchema = {
				type: Type.OBJECT,
				properties: {
					rankedIndices: {
						type: Type.ARRAY,
						description: "Array of topic indices ranked by relevance",
						items: { type: Type.NUMBER },
					},
					reasoning: {
						type: Type.STRING,
						description: "Brief explanation of the ranking decisions",
					},
				},
				required: ["rankedIndices", "reasoning"],
			};

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

	private buildFactsContext(extractedFacts: ExtractedFacts): string {
		if (!extractedFacts) return "";

		const parts: string[] = [];

		if (extractedFacts.companies?.length > 0) {
			parts.push(
				`Companies: ${extractedFacts.companies.map((c) => c.name).join(", ")}`,
			);
		}

		if (extractedFacts.roles?.length > 0) {
			parts.push(
				`Roles: ${extractedFacts.roles
					.map((r) => `${r.title} at ${r.company}`)
					.join(", ")}`,
			);
		}

		if (extractedFacts.projects?.length > 0) {
			parts.push(
				`Projects: ${extractedFacts.projects.map((p) => p.name).join(", ")}`,
			);
		}

		if (extractedFacts.skills?.length > 0) {
			parts.push(
				`Skills: ${extractedFacts.skills.map((s) => s.name).join(", ")}`,
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
