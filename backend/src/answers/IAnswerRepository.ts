import type { DatabaseClient } from "@/providers";
import type { Answer } from "./types.js";

/**
 * Repository interface for answer-related database operations
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
	): Promise<Answer>;

	/**
	 * Update an existing answer
	 */
	update(
		userId: string,
		answerId: number,
		answerText: string,
		recordingDurationSeconds?: number,
		client?: DatabaseClient,
	): Promise<Answer>;

	/**
	 * Get answers by interview ID
	 */
	getByInterviewId(userId: string, interviewId: number): Promise<Answer[]>;

	/**
	 * Get answer by ID
	 */
	getById(userId: string, answerId: number): Promise<Answer | null>;

	/**
	 * Delete answers for an interview
	 */
	deleteByInterviewId(userId: string, interviewId: number): Promise<void>;
}
