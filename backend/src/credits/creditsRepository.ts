import * as Sentry from "@sentry/node";
import { creditsConfig } from "@/config/credits.js";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { ICreditsRepository } from "./ICreditsRepository";
import type { CreditRecord, SourceType } from "./types.js";

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
		return parseInt(result.rows[0]?.total || "0", 10);
	}

	async addCredits(
		userId: string,
		amount: number,
		sourceType: SourceType,
		sourceAmount: number = amount,
		sourceUnit: string = "CREDITS",
		client?: DatabaseClient,
	): Promise<CreditRecord> {
		const db = client || (await this.db.getClient());

		if (amount <= 0) {
			throw new Error("Amount must be greater than zero");
		}
		const result = await db.query<CreditRecord>(
			`INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING *`,
			[userId, amount, sourceAmount, sourceType, sourceUnit],
		);

		const transaction = this.db.getFirstRowOrThrow(
			result,
			"Credit transaction insert failed - no rows returned",
		);

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
		sourceType:
			| "transcriber"
			| "extractor"
			| "topic_generator"
			| "topic_ranker",
		client?: DatabaseClient,
	): Promise<CreditRecord> {
		let rate: number;
		const db = client || (await this.db.getClient());

		if (tokensUsed <= 0) {
			throw new Error("Tokens used must be greater than zero");
		}
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

		const result = await db.query<CreditRecord>(
			`INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING *`,
			[userId, -creditsToConsume, sourceAmount, sourceType, "K_TOKENS"],
		);

		const credits = this.db.getFirstRowOrThrow(
			result,
			"Credit transaction insert failed - no rows returned",
		);

		Sentry.logger?.info?.("Credits consumed successfully", {
			user_id: userId,
			tokensUsed,
			sourceType,
			creditsConsumed: credits.amount,
		});

		return credits;
	}
}
