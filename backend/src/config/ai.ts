import { z } from "zod";
import "dotenv/config";

// AI configuration schema - only sensitive/environment-specific
const aiSchema = z.object({
	apiKey: z.string().min(1, "Gemini API key is required"),
});

// Parse and validate environment variables
const aiEnv = aiSchema.parse({
	apiKey: process.env.API_KEY,
});

export const aiConfig = {
	// Sensitive data (from environment)
	apiKey: aiEnv.apiKey,

	// Operational settings (hardcoded)
	models: {
		transcription: "gemini-2.5-flash",
		extraction: "gemini-2.5-flash",
		topicGeneration: "gemini-2.5-flash",
		topicReranking: "gemini-2.5-flash",
	},

	rateLimits: {
		requestsPerMinute: 150,
		requestsPerDay: 5000,
		maxRetries: 3,
		backoffMultiplier: 2,
	},
};
