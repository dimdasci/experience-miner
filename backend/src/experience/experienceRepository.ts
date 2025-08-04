import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import type { AppError } from "@/errors";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { IExperienceRepository } from "./IExperienceRepository";
import type { ExperienceRecord, ExtractedFacts } from "./types";

/**
 * PostgreSQL implementation of experience repository using purely functional patterns
 * Following the golden standard established by CreditsRepository
 */
export class ExperienceRepository implements IExperienceRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	saveOrUpdateRecord(
		userId: string,
		record: ExtractedFacts,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, ExperienceRecord> {
		const db = client || this.db;

		type QueryConfig = {
			sql: string;
			params: unknown[];
			operation: "created" | "updated";
		};

		return pipe(
			// Try to get existing record and determine operation
			this.getByUserId(userId, client),
			TE.fold(
				// Left case: Handle error and determine query
				(error: AppError): TE.TaskEither<AppError, QueryConfig> => {
					if (error.errorCode === "NOT_FOUND") {
						return TE.right({
							sql: `INSERT INTO experience (user_id, payload, updated_at)
								 VALUES ($1, $2, NOW())
								 RETURNING *`,
							params: [userId, JSON.stringify(record)],
							operation: "created",
						});
					}
					// Propagate other errors
					return TE.left(error);
				},
				// Right case: Record exists, prepare update query
				(_existing: ExperienceRecord): TE.TaskEither<AppError, QueryConfig> =>
					TE.right({
						sql: `UPDATE experience 
							 SET payload = $1, updated_at = NOW() 
							 WHERE user_id = $2 
							 RETURNING *`,
						params: [JSON.stringify(record), userId],
						operation: "updated",
					}),
			),
			// Execute the determined query
			TE.flatMap((queryConfig: QueryConfig) =>
				pipe(
					db.queryFirst<ExperienceRecord>(queryConfig.sql, queryConfig.params),
					TE.map((result: ExperienceRecord) => {
						Sentry.logger?.info?.(
							`Experience record ${queryConfig.operation}`,
							{
								userId,
								recordUpdated: queryConfig.operation === "updated",
								recordCreated: queryConfig.operation === "created",
							},
						);
						return result;
					}),
				),
			),
		);
	}

	getByUserId(
		userId: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, ExperienceRecord> {
		const db = client || this.db;
		return db.queryFirst<ExperienceRecord>(
			"SELECT * FROM experience WHERE user_id = $1",
			[userId],
		);
	}

	deleteRecord(userId: string): TE.TaskEither<AppError, void> {
		return pipe(
			this.db.query("DELETE FROM experience WHERE user_id = $1", [userId]),
			TE.map(() => {
				Sentry.logger?.info?.("Experience record deleted", {
					userId,
				});
			}),
		);
	}
}
