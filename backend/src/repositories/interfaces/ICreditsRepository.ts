import type { CreditTransaction, SourceType } from "@/types/services/index.js";

/**
 * Repository interface for credit operations
 */
export interface ICreditsRepository {
	/**
	 * Get current credit balance for user
	 */
	getCurrentBalance(userId: string): Promise<number>;

	/**
	 * Add credits to user account
	 */
	addCredits(
		userId: string,
		amount: number,
		sourceType: SourceType,
		sourceAmount?: number,
		sourceUnit?: string,
	): Promise<CreditTransaction>;

	/**
	 * Consume credits based on token usage and source type
	 */
	consumeCredits(
		userId: string,
		tokensUsed: number,
		sourceType: "transcriber" | "extractor" | "topic_generator" | "topic_ranker",
	): Promise<{ transaction: CreditTransaction; remainingCredits: number }>;
}
