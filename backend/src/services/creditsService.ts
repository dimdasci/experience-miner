import type { PoolClient } from "pg";
import { database } from "@/common/connections/databaseConnection.js";
import { logger } from "@/common/middleware/requestLogger.js";
import { creditsConfig } from "@/config/credits.js";
import type { CreditTransaction, SourceType } from "@/types/services/index.js";

// In-memory user processing locks to prevent concurrent operations
const userProcessingLocks = new Map<string, number>();

class CreditsService {
	async getCurrentBalance(userId: string): Promise<number> {
		const result = await database.query<{ total: string }>(
			"SELECT COALESCE(SUM(amount), 0) as total FROM credits WHERE user_id = $1",
			[userId],
		);

		return parseInt(result[0]?.total || "0", 10);
	}

	async addCredits(
		userId: string,
		amount: number,
		sourceType: SourceType,
		sourceAmount: number = amount,
		sourceUnit: string = "CREDITS",
	): Promise<CreditTransaction> {
		const transaction = await database.transaction<CreditTransaction>(
			async (client: PoolClient) => {
				const result = await client.query<CreditTransaction>(
					`INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
				 VALUES ($1, $2, $3, $4, $5)
				 RETURNING *`,
					[userId, amount, sourceAmount, sourceType, sourceUnit],
				);

				if (!result.rows || result.rows.length === 0) {
					throw new Error(
						"Credit transaction insert failed - no rows returned",
					);
				}

				const transaction = result.rows[0];
				if (!transaction) {
					throw new Error("Credit transaction insert returned empty row");
				}

				return transaction;
			},
		);

		logger.info("Credits added successfully", {
			user_id: userId,
			amount,
			sourceType,
			sourceAmount,
			sourceUnit,
			transaction_id: transaction.id,
		});

		return transaction;
	}

	async consumeCredits(
		userId: string,
		tokensUsed: number,
		sourceType:
			| "transcriber"
			| "extractor"
			| "topic_generator"
			| "topic_ranker",
	): Promise<{ transaction: CreditTransaction; remainingCredits: number }> {
		// Calculate credits based on token usage and rate
		let rate: number;
		switch (sourceType) {
			case "transcriber":
				rate = creditsConfig.rates.transcriber;
				break;
			case "extractor":
				rate = creditsConfig.rates.extractor;
				break;
			case "topic_generator":
				rate = creditsConfig.rates.topicGeneration;
				break;
			case "topic_ranker":
				rate = creditsConfig.rates.topicReranking;
				break;
			default:
				throw new Error(`Unknown source type: ${sourceType}`);
		}

		const sourceAmount = tokensUsed / 1000; // Convert to K_TOKENS
		const creditsToConsume = Math.max(1, Math.ceil(sourceAmount * rate)); // Minimum 1 credit

		// Insert the credit transaction
		const transactionResult = await database.transaction<CreditTransaction>(
			async (client: PoolClient) => {
				// Create negative transaction for credit consumption
				logger.debug("Inserting credit transaction", {
					userId,
					amount: -creditsToConsume,
					sourceAmount,
					sourceType,
					sourceUnit: "K_TOKENS",
				});

				const transaction = await client.query<CreditTransaction>(
					`INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
				 VALUES ($1, $2, $3, $4, $5)
				 RETURNING *`,
					[userId, -creditsToConsume, sourceAmount, sourceType, "K_TOKENS"],
				);

				logger.debug("Credit transaction insert result", {
					rowCount: transaction.rowCount,
					hasRows: transaction.rows.length > 0,
					transactionId: transaction.rows[0]?.id,
				});

				if (!transaction.rows || transaction.rows.length === 0) {
					throw new Error(
						"Credit transaction insert failed - no rows returned",
					);
				}

				const creditTransaction = transaction.rows[0];
				if (!creditTransaction) {
					throw new Error("Credit transaction insert returned empty row");
				}

				return creditTransaction;
			},
		);

		// Get the current balance after the transaction is committed
		const remainingCredits = await this.getCurrentBalance(userId);

		logger.debug("Final balance after credit consumption", {
			userId,
			remainingCredits,
			transactionId: transactionResult.id,
		});

		const result = {
			transaction: transactionResult,
			remainingCredits,
		};

		logger.info("Credits consumed successfully", {
			user_id: userId,
			tokensUsed,
			sourceType,
			creditsConsumed: creditsToConsume,
			remainingCredits: result.remainingCredits,
			transaction_id: result.transaction.id,
		});

		return result;
	}

	async checkUserLock(userId: string): Promise<boolean> {
		return userProcessingLocks.has(userId);
	}

	setUserLock(userId: string): void {
		userProcessingLocks.set(userId, Date.now());
		logger.info("User processing lock set", { user_id: userId });
	}

	removeUserLock(userId: string): void {
		const wasLocked = userProcessingLocks.delete(userId);
		if (wasLocked) {
			logger.info("User processing lock removed", { user_id: userId });
		}
	}

	async retryOperation<T>(
		operation: () => Promise<T>,
		maxRetries: number = 3,
		baseDelayMs: number = 100,
	): Promise<T> {
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (attempt === maxRetries) {
					break;
				}

				const delay = baseDelayMs * 3 ** (attempt - 1); // Exponential backoff
				logger.warn(`Database operation failed, retrying in ${delay}ms`, {
					attempt,
					maxRetries,
					error: lastError.message,
				});

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		if (!lastError) {
			throw new Error("Operation failed without specific error");
		}

		throw lastError;
	}

	async addWelcomeCredits(userId: string): Promise<CreditTransaction> {
		// Check if user already has welcome credits
		const existingWelcome = await database.query<CreditTransaction>(
			"SELECT * FROM credits WHERE user_id = $1 AND source_type = 'welcome' LIMIT 1",
			[userId],
		);

		if (existingWelcome.length > 0) {
			throw new Error("Welcome credits already granted");
		}

		return this.addCredits(userId, 100, "welcome", 100, "CREDITS");
	}
}

export const creditsService = new CreditsService();
