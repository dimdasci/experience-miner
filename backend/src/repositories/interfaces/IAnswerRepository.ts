import type { PoolClient } from "pg";
import type {
	Answer,
	CreateAnswerParams,
	UpdateAnswerParams,
} from "@/types/database/index.js";

/**
 * Repository interface for answer-related database operations
 */
export interface IAnswerRepository {
	/**
	 * Create a new answer
	 */
	create(params: CreateAnswerParams): Promise<Answer>;

	/**
	 * Create answer within a transaction
	 */
	createWithTransaction(
		client: PoolClient,
		params: CreateAnswerParams,
	): Promise<Answer>;

	/**
	 * Update an existing answer
	 */
	update(params: UpdateAnswerParams): Promise<Answer>;

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
