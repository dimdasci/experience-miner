import type * as TE from "fp-ts/lib/TaskEither";
import type { AppError } from "@/errors";
import type { DatabaseClient } from "@/providers";
import type { CreditRecord, SourceType } from "./types.js";

/**
 * Repository interface for credit operations using functional patterns
 */
export interface ICreditsRepository {
	/**
	 * Get current credit balance for user
	 */
	getCurrentBalance(userId: string): TE.TaskEither<AppError, number>;

	/**
	 * Add credits to user account
	 */
	addCredits(
		userId: string,
		amount: number,
		sourceType: SourceType,
		sourceAmount?: number,
		sourceUnit?: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, CreditRecord>;

	/**
	 * Consume credits based on token usage and source type
	 */
	consumeCredits(
		userId: string,
		tokensUsed: number,
		sourceType:
			| "transcriber"
			| "extractor"
			| "topic_generator"
			| "topic_ranker",
		client?: DatabaseClient,
	): TE.TaskEither<AppError, CreditRecord>;
}
