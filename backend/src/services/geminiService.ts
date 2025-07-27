import { GoogleGenAI, Type, type UsageMetadata } from "@google/genai";
import * as Sentry from "@sentry/node";

// Extended interface for usage metadata with all possible properties
interface ExtendedUsageMetadata extends UsageMetadata {
	candidatesTokenCount?: number;
}

import type { ExtractedFacts } from "@/common/types/interview.js";
import { env } from "@/common/utils/envConfig.js";

export interface GeminiResponse<T> {
	data: T;
	usageMetadata?: ExtendedUsageMetadata;
}

export class GeminiService {
	private ai: GoogleGenAI;
	private readonly model = "gemini-2.5-flash";

	constructor(aiClient?: GoogleGenAI) {
		this.ai = aiClient || new GoogleGenAI({ apiKey: env.API_KEY });
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
				model: this.model,
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
	): Promise<GeminiResponse<ExtractedFacts>> {
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
					description: "List of unique company names the user has worked for.",
					items: { type: Type.STRING },
				},
				roles: {
					type: Type.ARRAY,
					items: {
						type: Type.OBJECT,
						properties: {
							title: { type: Type.STRING },
							company: { type: Type.STRING },
							duration: { type: Type.STRING },
						},
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
						},
					},
				},
				achievements: {
					type: Type.ARRAY,
					items: { type: Type.STRING },
				},
				skills: {
					type: Type.ARRAY,
					items: { type: Type.STRING },
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
			const prompt = `Based on the following interview transcript, act as a professional career coach and extract the key information. The user is a job seeker trying to build their resume. Clean up the language and present it professionally.

TRANSCRIPT:
${transcript}`;

			const request = {
				model: this.model,
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
			const parsedJson = JSON.parse(jsonText) as ExtractedFacts;

			// Validate required fields
			if (!parsedJson.summary || !Array.isArray(parsedJson.companies)) {
				throw new Error("Invalid response format from Gemini");
			}

			return {
				data: parsedJson,
				usageMetadata: response.usageMetadata,
			};
		} catch (error) {
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
export const geminiService = new GeminiService();
