import type * as TE from "fp-ts/lib/TaskEither.js";
import type { ZodTypeAny, z } from "zod";
import type { AppError } from "@/errors";
import type { MediaData, ModelResponse } from "./types.js";

/**
 * Functional AI provider interface using TaskEither for composable error handling
 * Following the golden standard established by IDatabaseProvider
 */
export interface IGenerativeAIProvider {
	/**
	 * Generate completion with structured response schema
	 */
	generateCompletion<T extends ZodTypeAny>(
		task: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		responseSchema?: T,
	): TE.TaskEither<AppError, ModelResponse<z.infer<T>>>;

	/**
	 * Generate completion with string response
	 */
	generateCompletion(
		task: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		responseSchema?: string,
	): TE.TaskEither<AppError, ModelResponse<string>>;

	/**
	 * Close connections and cleanup resources
	 */
	close(): void;

	/**
	 * Health check for provider connectivity
	 * @returns Boolean indicating provider health
	 */
	isHealthy(): boolean;
}
