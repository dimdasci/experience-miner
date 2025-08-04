import type * as TE from "fp-ts/lib/TaskEither.js";
import type { AppError } from "@/errors";
import type { DatabaseClient } from "@/providers";
import type { Answer } from "./types.js";

/**
 * Functional repository interface for answer-related database operations
 * Uses TaskEither for composable error handling
 */
export interface IAnswerRepository {
	/**
	 * Create a new answer
	 */
	create(
		interviewId: number,
		userId: string,
		questionNumber: number,
		question: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Answer>;

	/**
	 * Update an existing answer
	 */
	update(
		userId: string,
		answerId: number,
		answerText: string,
		recordingDurationSeconds?: number,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Answer>;

	/**
	 * Get answers by interview ID
	 */
	getByInterviewId(
		userId: string,
		interviewId: number,
	): TE.TaskEither<AppError, Answer[]>;

	/**
	 * Get answer by ID
	 */
	getById(userId: string, answerId: number): TE.TaskEither<AppError, Answer>;
}
