import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { creditsConfig } from "@/config/credits.js";
import type { AppError } from "@/errors";
import { AppErrors } from "@/errors";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { ICreditsRepository } from "./ICreditsRepository";
import type { CreditRecord, SourceType } from "./types.js";

/**
 * PostgreSQL implementation of credits repository using purely functional patterns
 */
export class CreditsRepository implements ICreditsRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	getCurrentBalance(userId: string): TE.TaskEither<AppError, number> {
		return pipe(
			this.db.queryFirst<{ total: string }>(
				"SELECT COALESCE(SUM(amount), 0) as total FROM credits WHERE user_id = $1",
				[userId],
			),
			TE.map((row: { total: string }) => Number.parseInt(row.total || "0", 10)),
		);
	}

	addCredits(
		userId: string,
		amount: number,
		sourceType: SourceType,
		sourceAmount: number = amount,
		sourceUnit: string = "CREDITS",
		client?: DatabaseClient,
	): TE.TaskEither<AppError, CreditRecord> {
		// Early validation
		if (amount <= 0) {
			return TE.left(
				AppErrors.validationFailed(
					"amount",
					amount,
					"must be greater than zero",
				),
			);
		}

		const db = client || this.db;
		const insertQuery = `INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
							 VALUES ($1, $2, $3, $4, $5)
							 RETURNING *`;

		return pipe(
			db.queryFirst<CreditRecord>(insertQuery, [
				userId,
				amount,
				sourceAmount,
				sourceType,
				sourceUnit,
			]),
			// Log success and return
			TE.map((transaction: CreditRecord) => {
				Sentry.logger?.info?.("Credits added successfully", {
					user_id: userId,
					amount,
					sourceType,
					sourceAmount,
					sourceUnit,
					transaction_id: transaction.id,
				});
				return transaction;
			}),
		);
	}

	consumeCredits(
		userId: string,
		tokensUsed: number,
		sourceType: SourceType,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, CreditRecord> {
		// Early validation
		if (tokensUsed <= 0) {
			return TE.left(
				AppErrors.validationFailed(
					"tokensUsed",
					tokensUsed,
					"must be greater than zero",
				),
			);
		}

		const insertQuery = `INSERT INTO credits (user_id, amount, source_amount, source_type, source_unit)
							 VALUES ($1, $2, $3, $4, $5)
							 RETURNING *`;

		return pipe(
			this.getRate(sourceType),
			TE.map((rate) => {
				const sourceAmount = tokensUsed / 1000; // Convert to K_TOKENS
				const creditsToConsume = Math.max(1, Math.ceil(sourceAmount * rate));
				return { sourceAmount, creditsToConsume };
			}),
			// Execute credit consumption and extract first row
			TE.flatMap(({ sourceAmount, creditsToConsume }) => {
				const db = client || this.db;
				return db.queryFirst<CreditRecord>(insertQuery, [
					userId,
					-creditsToConsume,
					sourceAmount,
					sourceType,
					"K_TOKENS",
				]);
			}),
			// Log success and return
			TE.map((credits: CreditRecord) => {
				Sentry.logger?.info?.("Credits consumed successfully", {
					user_id: userId,
					tokensUsed,
					sourceType,
					creditsConsumed: credits.amount,
				});
				return credits;
			}),
		);
	}

	/**
	 * Get rate for source type - pure function that returns TaskEither
	 */
	private getRate(sourceType: SourceType): TE.TaskEither<AppError, number> {
		switch (sourceType) {
			case "transcriber":
				return TE.right(creditsConfig.rates.transcriber);
			case "extractor":
				return TE.right(creditsConfig.rates.extractor);
			case "topic_generator":
				return TE.right(creditsConfig.rates.topicGeneration);
			case "topic_ranker":
				return TE.right(creditsConfig.rates.topicReranking);
			default:
				return TE.left(
					AppErrors.validationFailed(
						"sourceType",
						sourceType,
						"unknown source type",
					),
				);
		}
	}
}
