import type { ZodTypeAny, z } from "zod";
import type { MediaData, ModelResponse } from "./types.js";

export interface IGenerativeAIProvider {
	generateCompletion<T extends ZodTypeAny>(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		temperature?: number,
		maxOutputTokens?: number,
		responseSchema?: T,
	): Promise<ModelResponse<z.infer<T>>>;

	generateCompletion(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		temperature?: number,
		maxOutputTokens?: number,
		responseSchema?: string,
	): Promise<ModelResponse<string>>;

	/**
	 * Close database connections and cleanup resources
	 */
	close(): void;

	/**
	 * Health check for database connectivity
	 * @returns Boolean indicating database health
	 */
	isHealthy(): boolean;
}
