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
	 * @returns Promise that resolves when cleanup is complete
	 */
	close(): Promise<void>;

	/**
	 * Health check for database connectivity
	 * @returns Promise with boolean indicating database health
	 */
	isHealthy(): Promise<boolean>;
}
