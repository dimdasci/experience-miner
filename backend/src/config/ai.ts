import { z } from "zod";
import "dotenv/config";

// AI configuration schema - only sensitive/environment-specific
const aiSchema = z.object({
	apiKey: z.string().min(1, "Gemini API key is required"),
	lfSecretKey: z.string().min(1, "Langfuse secret key is required"),
	lfPublicKey: z.string().min(1, "Langfuse public key is required"),
	lfHost: z.string().url("Langfuse host must be a valid URL"),
});

// Parse and validate environment variables
const aiEnv = aiSchema.parse({
	apiKey: process.env.API_KEY,
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

export const aiConfig = {
	// Sensitive data (from environment)
	apiKey: aiEnv.apiKey,

	langfuse: {
		secretKey: aiEnv.lfSecretKey,
		publicKey: aiEnv.lfPublicKey,
		host: aiEnv.lfHost,
	},

	// Operational settings (hardcoded)
	models: {
		transcription: "gemini-2.5-flash",
		extraction: "gemini-2.5-flash",
		topicGeneration: "gemini-2.5-flash",
		topicReranking: "gemini-2.5-flash",
	},

	maxTokens: {
		transcription: 5000,
		extraction: 7500,
		topicGeneration: 7500,
		topicReranking: 1000,
	},
	minAnswerLength: 32, // Minimum length for answers to be considered valid

	rateLimits: {
		requestsPerMinute: 150,
		requestsPerDay: 5000,
		maxRetries: 3,
		backoffMultiplier: 2,
	} as RateLimitConfig,
};
