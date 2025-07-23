import type { PoolClient } from "pg";
import { database } from "@/common/utils/database.js";

export interface Answer {
	id: string;
	created_at: string;
	user_id: string;
	question: string;
	answer: string;
	recording_duration_sec?: number;
	finished_at?: string;
	interview_id: number;
}

class DatabaseService {
	async saveAnswer(
		userId: string,
		question: string,
		answer: string,
		interviewId: number,
		recordingDuration?: number,
	): Promise<Answer> {
		const result = await database.query<Answer>(
			`INSERT INTO answers (user_id, question, answer, interview_id, recording_duration_sec, finished_at)
			 VALUES ($1, $2, $3, $4, $5, NOW())
			 RETURNING *`,
			[
				userId,
				question,
				answer,
				interviewId,
				recordingDuration !== undefined ? recordingDuration : null,
			],
		);

		if (!result || result.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const answerRecord = result[0];
		if (!answerRecord) {
			throw new Error("Answer insert returned empty row");
		}

		return answerRecord;
	}

	async saveAnswerWithTransaction(
		client: PoolClient,
		userId: string,
		question: string,
		answer: string,
		interviewId: number,
		recordingDuration?: number,
	): Promise<Answer> {
		const result = await client.query<Answer>(
			`INSERT INTO answers (user_id, question, answer, interview_id, recording_duration_sec, finished_at)
			 VALUES ($1, $2, $3, $4, $5, NOW())
			 RETURNING *`,
			[
				userId,
				question,
				answer,
				interviewId,
				recordingDuration !== undefined ? recordingDuration : null,
			],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const answerRecord = result.rows[0];
		if (!answerRecord) {
			throw new Error("Answer insert returned empty row");
		}

		return answerRecord;
	}

	async getAnswersByInterviewId(interviewId: number): Promise<Answer[]> {
		const result = await database.query<Answer>(
			"SELECT * FROM answers WHERE interview_id = $1 ORDER BY created_at ASC",
			[interviewId],
		);

		return result;
	}

	async getAnswersByUserId(userId: string): Promise<Answer[]> {
		const result = await database.query<Answer>(
			"SELECT * FROM answers WHERE user_id = $1 ORDER BY created_at DESC",
			[userId],
		);

		return result;
	}
}

export const databaseService = new DatabaseService();
