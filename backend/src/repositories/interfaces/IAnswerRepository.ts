import type { DatabaseClient } from "@/interfaces/providers/index.js";
import type {
	Answer,
} from "@/types/database/index.js";

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
	update(answerId: string, answerText: string, recordingDurationSeconds?: number, client?: DatabaseClient): Promise<Answer>;

	/**
	 * Get answers by interview ID
	 */
	getByInterviewId(interviewId: string): Promise<Answer[]>;

	/**
	 * Get answer by ID
	 */
	getById(answerId: string): Promise<Answer | null>;

	/**
	 * Delete answers for an interview
	 */
	deleteByInterviewId(interviewId: number): Promise<void>;
}
