import { GoogleGenAI, Type } from "@google/genai";
import * as Sentry from "@sentry/node";
import { aiConfig } from "@/config/ai.js";
import type { AIResponse } from "@/types/ai/index.js";
import type {
	Achievement,
	Company,
	Project,
	Role,
	Skill,
} from "@/types/database/index.js";

// Create a custom ExtractedFacts interface that represents the structure returned by Gemini
export interface ExtractedFacts {
	summary: string;
	companies: Company[];
	roles: Role[];
	projects: Project[];
	achievements: Achievement[];
	skills: Skill[];
}

// Use the generic AIResponse type for consistency
export type GeminiResponse<T> = AIResponse<T>;

export class TranscribeService {
	private ai: GoogleGenAI;

	constructor(aiClient?: GoogleGenAI) {
		this.ai = aiClient || new GoogleGenAI({ apiKey: aiConfig.apiKey });
	}

	async transcribeAudio(
		audioBuffer: Buffer,
		mimeType: string,
	): Promise<GeminiResponse<string>> {
		try {
			const base64Audio = audioBuffer.toString("base64");

			const audioPart = {
				inlineData: {
					mimeType,
					data: base64Audio,
				},
			};

			const request = {
				model: aiConfig.models.transcription,
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

			const response = await this.ai.models.generateContent(request);

			if (!response.text) {
				throw new Error("No transcription received from Gemini");
			}

			return {
				data: response.text,
				usageMetadata: response.usageMetadata,
			};
		} catch (error) {
			// Track transcription error with context
			Sentry.captureException(error, {
				tags: { service: "gemini", operation: "transcription" },
				contexts: {
					request: {
						mimeType,
						bufferSize: audioBuffer.length,
					},
				},
			});
			// Supplementary logging for development
			Sentry.logger?.error?.("Gemini transcription failed", {
				mime_type: mimeType,
				buffer_size: audioBuffer.length,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(
				`Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async extractFacts(
		transcript: string,
		interviewId: string, // Not used directly but kept for API consistency - will be added by caller
	): Promise<GeminiResponse<ExtractedFacts>> {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		void interviewId; // Acknowledge parameter to suppress warning
		const responseSchema = {
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
						required: ["title", "company", "duration", "sourceQuestionNumber"],
					},
				},
				projects: {
					type: Type.ARRAY,
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

		try {
			const prompt = `Based on the following interview transcript, act as a professional career coach and extract the key information. The user is a job seeker trying to build their resume. Clean up the language and present it professionally on a user behalf.

For each extracted item (company, role, project, achievement, skill), include a 'sourceQuestionNumber' field indicating which question number in the transcript the information came from.

<transcript>
${transcript}
</transcript>`;

			const request = {
				model: aiConfig.models.extraction,
				contents: prompt,
				config: {
					responseMimeType: "application/json",
					responseSchema: responseSchema,
					temperature: 0.2,
				},
			};

			const response = await this.ai.models.generateContent(request);

			if (!response.text) {
				throw new Error("No extraction response received from Gemini");
			}

			const jsonText = response.text.trim();
			const rawData = JSON.parse(jsonText);

			// Validate required fields
			if (!rawData.summary || !Array.isArray(rawData.companies)) {
				throw new Error("Invalid response format from Gemini");
			}

			// Return the raw data directly without any post-processing
			// Let the caller handle all necessary transformations and additions
			return {
				data: rawData as ExtractedFacts,
				usageMetadata: response.usageMetadata,
			};
		} catch (error: unknown) {
			// Track extraction error with context
			Sentry.captureException(error, {
				tags: { service: "gemini", operation: "extraction" },
				contexts: {
					request: {
						transcriptLength: transcript.length,
					},
				},
			});
			// Supplementary logging for development
			Sentry.logger?.error?.("Gemini extraction failed", {
				transcript_length: transcript.length,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(
				`Failed to extract facts: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

// Export the singleton instance for production use
export const transcribeService = new TranscribeService();
