import type * as TE from "fp-ts/lib/TaskEither";
import type { AppError } from "@/errors";
import type { DatabaseClient } from "@/providers";
import type { Interview, InterviewStatus } from "./types.js";

/**
 * Functional repository interface for interview-related database operations
 * Uses TaskEither for composable error handling
 */
export interface IInterviewRepository {
	/**
	 * Create a new interview
	 */
	create(
		userId: string,
		title: string,
		motivationalQuote: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Interview>;

	/**
	 * Get interview by ID
	 */
	getById(
		userId: string,
		interviewId: number,
	): TE.TaskEither<AppError, Interview>;

	/**
	 * Get all interviews for a user
	 */
	getAllByUserId(userId: string): TE.TaskEither<AppError, Interview[]>;

	/**
	 * Update interview status
	 */
	updateStatus(
		userId: string,
		interviewId: number,
		status: InterviewStatus,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Interview>;

	/**
	 * Delete interview and related data
	 */
	delete(userId: string, interviewId: number): TE.TaskEither<AppError, void>;
}
