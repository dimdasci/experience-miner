import * as Sentry from "@sentry/node";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type {
	Answer,
} from "@/types/domain";
import type { IAnswerRepository } from "./interfaces";

/**
 * PostgreSQL implementation of answer repository
 */
export class AnswerRepository implements IAnswerRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	/**
	 * Create a new answer
	 * @param interviewId - ID of the interview
	 * @param userId - ID of the user
	 * @param questionNumber - The question number in the interview
	 * @param question - The question text
	 * @param client - Optional database client for transactions
	 * @returns The created Answer object
	 */
	async create(
		interviewId: number,
		userId: string,
		questionNumber: number,
		question: string,
		client?: DatabaseClient,	
	): Promise<Answer> {
		// choose the connection method based on whether a client is provided
		const db = client || (await this.db.getClient());
		const result = await db.query<Answer>(
			`INSERT INTO answers (interview_id, user_id, question_number, question, answer, recording_duration_seconds, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, NULL, NULL, NOW(), NOW())
			 RETURNING *`,
			[
				interviewId,
				userId,
				questionNumber,
				question,
			],
		);

		const answer = this.db.getFirstRowOrThrow(result, "Answer insert failed - no rows returned");

		Sentry.logger?.debug?.("Answer record created", {
			answerId: answer.id,
			interviewId,
			questionNumber,
		});

		return answer;
	}

	async update(
		userId: string,
		answerId: number,
		answerText: string,
		recordingDurationSeconds?: number,
		client?: DatabaseClient
	): Promise<Answer> {
		const db = client || (await this.db.getClient());
		const result = await db.query<Answer>(
			`UPDATE answers 
			 SET answer = $1, recording_duration_seconds = $2, updated_at = NOW() 
			 WHERE id = $3 AND user_id = $4 
			 RETURNING *`,
			[answerText, recordingDurationSeconds || null, answerId, userId],
		);
		const answer = this.db.getFirstRowOrThrow(result, "Answer update failed - answer not found");

		Sentry.logger?.debug?.("Answer updated successfully", {
			answerId: answer.id,
			answerLength: answer.answer?.length || 0,
			duration: recordingDurationSeconds,
		});

		return answer;
	}

	async getByInterviewId(userId: string, interviewId: number): Promise<Answer[]> {
		const result = await this.db.query<Answer>(
			`SELECT * FROM answers 
			 WHERE interview_id = $1 AND user_id = $2
			 ORDER BY question_number ASC`,
			[interviewId, userId],
		);

		return result.rows;
	}

	async getById(userId: string, answerId: number): Promise<Answer | null> {
		const result = await this.db.query<Answer>(
			"SELECT * FROM answers WHERE id = $1 AND user_id = $2",
			[answerId, userId],
		);

		return result.rows.length > 0 ? (result.rows[0] ?? null) : null;
	}

	async deleteByInterviewId(userId: string, interviewId: number): Promise<void> {
		await this.db.query("DELETE FROM answers WHERE interview_id = $1 AND user_id = $2", [
			interviewId,
			userId,
		]);

		Sentry.logger?.debug?.("Answers deleted for interview", {
			interviewId,
		});
	}
}
