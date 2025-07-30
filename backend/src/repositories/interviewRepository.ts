import * as Sentry from "@sentry/node";
import type { PoolClient } from "pg";
import { ServiceContainer } from "@/container/serviceContainer.js";
import type {
	CreateInterviewParams,
	Interview,
	InterviewStatus,
} from "@/types/database/index.js";
import type { IInterviewRepository } from "./interfaces/index.js";

/**
 * PostgreSQL implementation of interview repository
 */
export class InterviewRepository implements IInterviewRepository {
	private get db() {
		return ServiceContainer.getInstance().getDatabaseProvider();
	}

	async create(params: CreateInterviewParams): Promise<Interview> {
		const result = await this.db.query<Interview>(
			`INSERT INTO interviews (user_id, title, motivational_quote, status, created_at, updated_at)
			 VALUES ($1, $2, $3, 'draft', NOW(), NOW())
			 RETURNING *`,
			[params.userId, params.title, params.motivational_quote],
		);

		if (!result || result.length === 0) {
			throw new Error("Interview insert failed - no rows returned");
		}

		const interview = result[0];
		if (!interview) {
			throw new Error("Interview insert returned empty row");
		}

		Sentry.logger?.info?.("Interview created successfully", {
			interviewId: interview.id,
			userId: params.userId,
			title: params.title,
		});

		return interview;
	}

	async createWithTransaction(
		client: PoolClient,
		params: CreateInterviewParams,
	): Promise<Interview> {
		const result = await client.query<Interview>(
			`INSERT INTO interviews (user_id, title, motivational_quote, status, created_at, updated_at)
			 VALUES ($1, $2, $3, 'draft', NOW(), NOW())
			 RETURNING *`,
			[params.userId, params.title, params.motivational_quote],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Interview insert failed - no rows returned");
		}

		const interview = result.rows[0];
		if (!interview) {
			throw new Error("Interview insert returned empty row");
		}

		Sentry.logger?.info?.("Interview created successfully within transaction", {
			interviewId: interview.id,
			userId: params.userId,
			title: params.title,
		});

		return interview;
	}

	async getById(interviewId: string): Promise<Interview | null> {
		const result = await this.db.query<Interview>(
			"SELECT * FROM interviews WHERE id = $1",
			[parseInt(interviewId, 10)],
		);

		return result.length > 0 ? (result[0] ?? null) : null;
	}

	async getAllByUserId(userId: string): Promise<Interview[]> {
		const result = await this.db.query<Interview>(
			`SELECT * FROM interviews 
			 WHERE user_id = $1 
			 ORDER BY created_at DESC`,
			[userId],
		);

		return result;
	}

	async updateStatus(
		interviewId: number,
		status: InterviewStatus,
	): Promise<Interview> {
		const result = await this.db.query<Interview>(
			`UPDATE interviews 
			 SET status = $1, updated_at = NOW() 
			 WHERE id = $2 
			 RETURNING *`,
			[status, interviewId],
		);

		if (!result || result.length === 0) {
			throw new Error("Interview update failed - interview not found");
		}

		const interview = result[0];
		if (!interview) {
			throw new Error("Interview update returned empty row");
		}

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
