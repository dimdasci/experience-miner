import * as Sentry from "@sentry/node";
import type { DatabaseClient } from "@/interfaces/providers/index.js";
import type { IDatabaseProvider } from "@/interfaces/providers/index.js";
import type {
	Interview,
	InterviewStatus,
} from "@/types/database/index.js";
import type { IInterviewRepository } from "./interfaces/index.js";

/**
 * PostgreSQL implementation of interview repository
 */
export class InterviewRepository implements IInterviewRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	/**
	 * Creates a new interview for the given user
	 * @param userId User ID to associate with the interview
	 * @param title Title of the interview
	 * @param motivationalQuote Motivational quote for the interview
	 * @param client Optional database client for transaction support
	 * @return Created interview object
	 */
	async create(userId: string,
		title: string,
		motivationalQuote: string,
		client?: DatabaseClient
	): Promise<Interview> {
		const db = client || (await this.db.getClient());
		const result = await db.query<Interview>(
			`INSERT INTO interviews (user_id, title, motivational_quote, status, created_at, updated_at)
			 VALUES ($1, $2, $3, 'draft', NOW(), NOW())
			 RETURNING *`,
			[userId, title, motivationalQuote],
		);

		const interview = this.db.getFirstRowOrThrow(result, "Interview insert failed - no rows returned");

		Sentry.logger?.info?.("Interview created successfully", {
			interviewId: interview.id,
			userId: userId,
			title: title,
		});

		return interview;
	}

	async getById(interviewId: string): Promise<Interview | null> {
		const result = await this.db.query<Interview>(
			"SELECT * FROM interviews WHERE id = $1",
			[parseInt(interviewId, 10)],
		);

		return result.rows.length > 0 ? (result.rows[0] ?? null) : null;
	}

	async getAllByUserId(userId: string): Promise<Interview[]> {
		const result = await this.db.query<Interview>(
			`SELECT * FROM interviews 
			 WHERE user_id = $1 
			 ORDER BY created_at DESC`,
			[userId],
		);

		return result.rows.length > 0 ? result.rows : [];
	}

	/**
	 * Updates the status of an interview
	 * @param interviewId ID of the interview to update
	 * @param status New status to set
	 * @param client Optional database client for transaction support
	 * @return Updated interview object
	 */
	async updateStatus(
		interviewId: number,
		status: InterviewStatus,
		client?: DatabaseClient
	): Promise<Interview> {
		const db = client || (await this.db.getClient());
		const result = await db.query<Interview>(
			`UPDATE interviews 
			 SET status = $1, updated_at = NOW() 
			 WHERE id = $2 
			 RETURNING *`,
			[status, interviewId],
		);

		const interview = this.db.getFirstRowOrThrow(result, "Interview update failed - interview not found");

		Sentry.logger?.info?.("Interview status updated", {
			interviewId,
			newStatus: status,
		});

		return interview;
	}

	async delete(interviewId: number): Promise<void> {
		// Delete in correct order due to foreign key constraints

		// First delete answers
		await this.db.query("DELETE FROM answers WHERE interview_id = $1", [
			interviewId,
		]);

		// Then delete the interview
		await this.db.query("DELETE FROM interviews WHERE id = $1", [interviewId]);

		Sentry.logger?.info?.("Interview and related data deleted", {
			interviewId,
		});
	}
}
