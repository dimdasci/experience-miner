import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import type { AppError } from "@/errors";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { IAnswerRepository } from "./IAnswerRepository";
import type { Answer } from "./types.js";

/**
 * PostgreSQL implementation of answer repository using purely functional patterns
 */
export class AnswerRepository implements IAnswerRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	create(
		interviewId: number,
		userId: string,
		questionNumber: number,
		question: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Answer> {
		const db = client || this.db;
		const insertQuery = `INSERT INTO answers (interview_id, user_id, question_number, question, answer, recording_duration_seconds, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, NULL, NULL, NOW(), NOW())
			 RETURNING *`;

		return pipe(
			db.queryFirst<Answer>(insertQuery, [
				interviewId,
				userId,
				questionNumber,
				question,
			]),
			TE.map((answer: Answer) => {
				Sentry.logger?.debug?.("Answer record created", {
					answerId: answer.id,
					interviewId,
					questionNumber,
				});
				return answer;
			}),
		);
	}

	update(
		userId: string,
		answerId: number,
		answerText: string,
		recordingDurationSeconds?: number,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Answer> {
		const db = client || this.db;
		const updateQuery = `UPDATE answers 
			 SET answer = $1, recording_duration_seconds = $2, updated_at = NOW() 
			 WHERE id = $3 AND user_id = $4 
			 RETURNING *`;

		return pipe(
			db.queryFirst<Answer>(updateQuery, [
				answerText,
				recordingDurationSeconds || null,
				answerId,
				userId,
			]),
			TE.map((answer: Answer) => {
				Sentry.logger?.debug?.("Answer updated successfully", {
					answerId: answer.id,
					answerLength: answer.answer?.length || 0,
					duration: recordingDurationSeconds,
				});
				return answer;
			}),
		);
	}

	getByInterviewId(
		userId: string,
		interviewId: number,
	): TE.TaskEither<AppError, Answer[]> {
		return pipe(
			this.db.query<Answer>(
				`SELECT * FROM answers 
				 WHERE interview_id = $1 AND user_id = $2
				 ORDER BY question_number ASC`,
				[interviewId, userId],
			),
			TE.map((result) => result.rows),
		);
	}

	getById(userId: string, answerId: number): TE.TaskEither<AppError, Answer> {
		return this.db.queryFirst<Answer>(
			"SELECT * FROM answers WHERE id = $1 AND user_id = $2",
			[answerId, userId],
		);
	}
}
