import { z } from "zod";
import "dotenv/config";

// AI configuration schema - only sensitive/environment-specific
const aiSchema = z.object({
	geminiApiKey: z.string().min(1, "Gemini API key is required"),
	openaiApiKey: z.string().min(1, "OpenAI API key is required"),
	lfSecretKey: z.string().min(1, "Langfuse secret key is required"),
	lfPublicKey: z.string().min(1, "Langfuse public key is required"),
	lfHost: z.string().url("Langfuse host must be a valid URL"),
});

// Parse and validate environment variables
const aiEnv = aiSchema.parse({
	geminiApiKey: process.env.GEMINI_API_KEY,
	openaiApiKey: process.env.OPENAI_API_KEY,
	lfSecretKey: process.env.LF_SECRET_KEY,
	lfPublicKey: process.env.LF_PUBLIC_KEY,
	lfHost: process.env.LF_HOST,
});

export interface RateLimitConfig {
	requestsPerMinute: number;
	requestsPerDay: number;
	backoffMultiplier: number;
	maxRetries: number;
}

export interface GeminiProviderConfig {
	apiKey: string;
	models: Record<string, string>;
	maxTokens: Record<string, number>;
	temperatures: Record<string, number>;
	rateLimits: RateLimitConfig;
}

export interface OpenAIProviderConfig {
	apiKey: string;
	models: Record<string, string>;
	maxTokens: Record<string, number>;
	temperatures: Record<string, number | undefined>; // Allow undefined temperature
	sdkOptions: { maxRetries: number; timeout: number };
}

export const aiConfig = {
	providers: {
		gemini: {
			apiKey: aiEnv.geminiApiKey,
			models: { transcription: "gemini-2.5-flash" },
			maxTokens: { transcription: 10000 },
			temperatures: { transcription: 0.0 },
			rateLimits: {
				requestsPerMinute: 150,
				requestsPerDay: 5000,
				maxRetries: 3,
				backoffMultiplier: 2,
			},
		} as GeminiProviderConfig,
		openai: {
			apiKey: aiEnv.openaiApiKey,
			models: {
				extraction: "gpt-4o-mini-2024-07-18", // gpt-4o-2024-11-20 if more power is needed
				topicGeneration: "o3-mini-2025-01-31", // Reasoning
				topicReranking: "gpt-4o-mini-2024-07-18", // Cost-effective
			},
			maxTokens: {
				extraction: 7500,
				topicGeneration: 7500,
				topicReranking: 1000,
			},
			temperatures: {
				extraction: 0.0,
				topicGeneration: undefined, // Model doesn't support temperature parameter
				topicReranking: 0.1,
			},
			sdkOptions: { maxRetries: 3, timeout: 30000 },
		} as OpenAIProviderConfig,
	},

	tasks: {
		transcription: "gemini" as const,
		extraction: "openai" as const,
		topicGeneration: "openai" as const,
		topicReranking: "openai" as const,
	},

	minAnswerLength: 32,
	langfuse: {
		secretKey: aiEnv.lfSecretKey,
		publicKey: aiEnv.lfPublicKey,
		host: aiEnv.lfHost,
	},
};
