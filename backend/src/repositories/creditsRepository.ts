import * as Sentry from "@sentry/node";
import type { IDatabaseProvider } from "@/interfaces/providers/index.js";
import type { CreditTransaction, SourceType } from "@/types/services/index.js";
import type { ICreditsRepository } from "./interfaces/ICreditsRepository.js";
import { creditsConfig } from "@/config/credits.js";

/**
 * PostgreSQL implementation of credits repository
 */
export class CreditsRepository implements ICreditsRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	async getCurrentBalance(userId: string): Promise<number> {
		const result = await this.db.query<{ total: string }>(
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
		const result = await this.db.query<CreditTransaction>(
			`INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING *`,
			[userId, amount, sourceAmount, sourceType, sourceUnit],
		);

		if (!result || result.length === 0) {
			throw new Error("Credit transaction insert failed - no rows returned");
		}

		const transaction = result[0];
		if (!transaction) {
			throw new Error("Credit transaction insert returned empty row");
		}

		Sentry.logger?.info?.("Credits added successfully", {
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
		sourceType: "transcriber" | "extractor" | "topic_generator" | "topic_ranker",
	): Promise<{ transaction: CreditTransaction; remainingCredits: number }> {
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

		// Transaction handling
		const transaction = await this.db.transaction<CreditTransaction>(async () => {
			const result = await this.db.query<CreditTransaction>(
				`INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
				 VALUES ($1, $2, $3, $4, $5)
				 RETURNING *`,
				[userId, -creditsToConsume, sourceAmount, sourceType, "K_TOKENS"],
			);

			if (!result || result.length === 0) {
				throw new Error("Credit transaction insert failed - no rows returned");
			}

			const creditTransaction = result[0];
			if (!creditTransaction) {
				throw new Error("Credit transaction insert returned empty row");
			}

			return creditTransaction;
		});

		const remainingCredits = await this.getCurrentBalance(userId);

		Sentry.logger?.info?.("Credits consumed successfully", {
			user_id: userId,
			tokensUsed,
			sourceType,
			creditsConsumed: creditsToConsume,
			remainingCredits,
			transaction_id: transaction.id,
		});

		return {
			transaction,
			remainingCredits,
		};
    }
};