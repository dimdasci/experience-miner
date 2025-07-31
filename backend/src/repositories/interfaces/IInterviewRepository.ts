import type { DatabaseClient } from "@/interfaces/providers/index.js";
import type {
	Interview,
	InterviewStatus,
} from "@/types/database/index.js";

/**
 * Repository interface for interview-related database operations
 */
export interface IInterviewRepository {
	/**
	 * Create a new interview
	 */
	create(userId: string,
		title: string,
		motivationalQuote: string,
		client?: DatabaseClient,
	): Promise<Interview>;

	/**
	 * Get interview by ID
	 */
	getById(interviewId: string): Promise<Interview | null>;

	/**
	 * Get all interviews for a user
	 */
	getAllByUserId(userId: string): Promise<Interview[]>;

	/**
	 * Update interview status
	 */
	updateStatus(
		interviewId: number,
		status: InterviewStatus,
	): Promise<Interview>;

	/**
	 * Delete interview and related data
	 */
	delete(interviewId: number): Promise<void>;
}
