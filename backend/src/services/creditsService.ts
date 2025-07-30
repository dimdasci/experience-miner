import * as Sentry from "@sentry/node";
import type { ICreditsRepository } from "@/repositories/interfaces/ICreditsRepository";
import type { CreditTransaction, SourceType } from "@/types/services/index.js";

// In-memory user processing locks to prevent concurrent operations
const userProcessingLocks = new Map<string, number>();

export class CreditsService {
	private creditsRepository: ICreditsRepository;

	constructor(creditsRepository: ICreditsRepository) {
		this.creditsRepository = creditsRepository;
	}

	async getCurrentBalance(userId: string): Promise<number> {
		try {
			Sentry.logger?.debug?.("Getting current credit balance", {
				user_id: userId,
				component: "CreditsService",
				operation: "getCurrentBalance",
			});
			const result = await this.creditsRepository.getCurrentBalance(userId);
			Sentry.logger?.debug?.("Current credit balance fetched", {
				user_id: userId,
				balance: result,
				component: "CreditsService",
			});
			return result;
		} catch (error) {
			Sentry.captureException(error, {
				tags: { service: "credits", operation: "get_current_balance" },
				contexts: {
					user: { id: userId },
					operation: {
						name: "getCurrentBalance",
						component: "CreditsService",
					},
				},
			});
			Sentry.logger?.error?.("Failed to get current credit balance", {
				user_id: userId,
				operation: "getCurrentBalance",
				component: "CreditsService",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async addCredits(
		userId: string,
		amount: number,
		sourceType: SourceType,
		sourceAmount: number = amount,
		sourceUnit: string = "CREDITS",
	): Promise<CreditTransaction> {
		try {
			const transaction = await this.creditsRepository.addCredits(
				userId,
				amount,
				sourceType,
				sourceAmount,
				sourceUnit,
			);
			Sentry.logger?.info?.("Credits added successfully", {
				user_id: userId,
				amount,
				sourceType,
				sourceAmount,
				sourceUnit,
				transaction_id: transaction.id,
				component: "CreditsService",
				operation: "addCredits",
			});
			return transaction;
		} catch (error) {
			Sentry.captureException(error, {
				tags: { service: "credits", operation: "add_credits" },
				contexts: {
					user: { id: userId },
					operation: {
						name: "addCredits",
						component: "CreditsService",
					},
				},
			});
			Sentry.logger?.error?.("Failed to add credits", {
				user_id: userId,
				operation: "addCredits",
				component: "CreditsService",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async consumeCredits(
		userId: string,
		tokensUsed: number,
		sourceType: "transcriber" | "extractor" | "topic_generator" | "topic_ranker",
	): Promise<{ transaction: CreditTransaction; remainingCredits: number }> {
		try {
			Sentry.logger?.info?.("Consuming credits", {
				user_id: userId,
				tokensUsed,
				sourceType,
				component: "CreditsService",
				operation: "consumeCredits",
			});
			const result = await this.creditsRepository.consumeCredits(
				userId,
				tokensUsed,
				sourceType,
			);
			Sentry.logger?.info?.("Credits consumed successfully", {
				user_id: userId,
				tokensUsed,
				sourceType,
				creditsConsumed: result.transaction.amount,
				remainingCredits: result.remainingCredits,
				transaction_id: result.transaction.id,
				component: "CreditsService",
				operation: "consumeCredits",
			});
			return result;
		} catch (error) {
			Sentry.captureException(error, {
				tags: { service: "credits", operation: "consume_credits" },
				contexts: {
					user: { id: userId },
					operation: {
						name: "consumeCredits",
						component: "CreditsService",
					},
				},
			});
			Sentry.logger?.error?.("Failed to consume credits", {
				user_id: userId,
				operation: "consumeCredits",
				component: "CreditsService",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async checkUserLock(userId: string): Promise<boolean> {
		return userProcessingLocks.has(userId);
	}

	setUserLock(userId: string): void {
		userProcessingLocks.set(userId, Date.now());
		Sentry.logger?.info?.("User processing lock set", { user_id: userId });
	}

	removeUserLock(userId: string): void {
		const wasLocked = userProcessingLocks.delete(userId);
		if (wasLocked) {
			Sentry.logger?.info?.("User processing lock removed", { user_id: userId });
		}
	}
}
