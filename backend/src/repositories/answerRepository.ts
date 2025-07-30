import * as Sentry from "@sentry/node";
import type { PoolClient } from "pg";
import { ServiceContainer } from "@/container/serviceContainer.js";
import type {
	Answer,
	CreateAnswerParams,
	UpdateAnswerParams,
} from "@/types/database/index.js";
import type { IAnswerRepository } from "./interfaces/index.js";

/**
 * PostgreSQL implementation of answer repository
 */
export class AnswerRepository implements IAnswerRepository {
	private get db() {
		return ServiceContainer.getInstance().getDatabaseProvider();
	}

	async create(params: CreateAnswerParams): Promise<Answer> {
		const result = await this.db.query<Answer>(
			`INSERT INTO answers (interview_id, user_id, question_number, question, answer, recording_duration_seconds, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, NULL, NULL, NOW(), NOW())
			 RETURNING *`,
			[
				params.interviewId,
				params.userId,
				params.questionNumber,
				params.question,
			],
		);

		if (!result || result.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const answer = result[0];
		if (!answer) {
			throw new Error("Answer insert returned empty row");
		}

		Sentry.logger?.debug?.("Answer record created", {
			answerId: answer.id,
			interviewId: params.interviewId,
			questionNumber: params.questionNumber,
		});

		return answer;
	}

	async createWithTransaction(
		client: PoolClient,
		params: CreateAnswerParams,
	): Promise<Answer> {
		const result = await client.query<Answer>(
			`INSERT INTO answers (interview_id, user_id, question_number, question, answer, recording_duration_seconds, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, NULL, NULL, NOW(), NOW())
			 RETURNING *`,
			[
				params.interviewId,
				params.userId,
				params.questionNumber,
				params.question,
			],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const answer = result.rows[0];
		if (!answer) {
			throw new Error("Answer insert returned empty row");
		}

		Sentry.logger?.debug?.("Answer record created within transaction", {
			answerId: answer.id,
			interviewId: params.interviewId,
			questionNumber: params.questionNumber,
		});

		return answer;
	}

	async update(params: UpdateAnswerParams): Promise<Answer> {
		const result = await this.db.query<Answer>(
			`UPDATE answers 
			 SET answer = $1, recording_duration_seconds = $2, updated_at = NOW() 
			 WHERE id = $3 
			 RETURNING *`,
			[params.answer, params.recordingDurationSeconds || null, params.answerId],
		);

		if (!result || result.length === 0) {
			throw new Error("Answer update failed - answer not found");
		}

		const answer = result[0];
		if (!answer) {
			throw new Error("Answer update returned empty row");
		}

		Sentry.logger?.debug?.("Answer updated successfully", {
			answerId: params.answerId,
			answerLength: params.answer.length,
			duration: params.recordingDurationSeconds,
		});

		return answer;
	}

	async getByInterviewId(interviewId: string): Promise<Answer[]> {
		const result = await this.db.query<Answer>(
			`SELECT * FROM answers 
			 WHERE interview_id = $1 
			 ORDER BY question_number ASC`,
			[parseInt(interviewId, 10)],
		);

		return result;
	}

	async getById(answerId: string): Promise<Answer | null> {
		const result = await this.db.query<Answer>(
			"SELECT * FROM answers WHERE id = $1",
			[answerId],
		);

		return result.length > 0 ? (result[0] ?? null) : null;
	}

	async deleteByInterviewId(interviewId: number): Promise<void> {
		await this.db.query("DELETE FROM answers WHERE interview_id = $1", [
			interviewId,
		]);

		Sentry.logger?.debug?.("Answers deleted for interview", {
			interviewId,
		});
	}
}
