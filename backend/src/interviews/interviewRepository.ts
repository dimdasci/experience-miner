import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import type { AppError } from "@/errors";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { IInterviewRepository } from "./IInterviewRepository";
import type { Interview, InterviewStatus } from "./types.js";

/**
 * PostgreSQL implementation of interview repository using purely functional patterns
 */
export class InterviewRepository implements IInterviewRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	create(
		userId: string,
		title: string,
		motivationalQuote: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Interview> {
		const db = client || this.db;
		const insertQuery = `INSERT INTO interviews (user_id, title, motivational_quote, status, created_at, updated_at)
			 VALUES ($1, $2, $3, 'draft', NOW(), NOW())
			 RETURNING *`;

		return pipe(
			db.queryFirst<Interview>(insertQuery, [userId, title, motivationalQuote]),
			TE.map((interview: Interview) => {
				Sentry.logger?.info?.("Interview created successfully", {
					interviewId: interview.id,
					userId: userId,
					title: title,
				});
				return interview;
			}),
		);
	}

	getById(
		userId: string,
		interviewId: number,
	): TE.TaskEither<AppError, Interview> {
		return this.db.queryFirst<Interview>(
			"SELECT * FROM interviews WHERE id = $1 AND user_id = $2",
			[interviewId, userId],
		);
	}

	getAllByUserId(userId: string): TE.TaskEither<AppError, Interview[]> {
		return pipe(
			this.db.query<Interview>(
				`SELECT * FROM interviews 
				 WHERE user_id = $1 
				 ORDER BY created_at DESC`,
				[userId],
			),
			TE.map((result) => result.rows),
		);
	}

	updateStatus(
		userId: string,
		interviewId: number,
		status: InterviewStatus,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Interview> {
		const db = client || this.db;
		const updateQuery = `UPDATE interviews 
			 SET status = $1, updated_at = NOW() 
			 WHERE id = $2 AND user_id = $3
			 RETURNING *`;

		return pipe(
			db.queryFirst<Interview>(updateQuery, [status, interviewId, userId]),
			TE.map((interview: Interview) => {
				Sentry.logger?.info?.("Interview status updated", {
					interviewId,
					newStatus: status,
				});
				return interview;
			}),
		);
	}

	delete(userId: string, interviewId: number): TE.TaskEither<AppError, void> {
		return pipe(
			this.db.query("DELETE FROM interviews WHERE id = $1 AND user_id = $2", [
				interviewId,
				userId,
			]),
			// Log successful deletion
			TE.map(() => {
				Sentry.logger?.info?.("Interview and related data deleted", {
					interviewId,
				});
			}),
		);
	}
}
