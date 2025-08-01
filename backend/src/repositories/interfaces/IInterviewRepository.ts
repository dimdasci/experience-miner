import type { DatabaseClient } from "@/providers";
import type { Interview, InterviewStatus } from "@/types/domain";

/**
 * Repository interface for interview-related database operations
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
	): Promise<Interview>;

	/**
	 * Get interview by ID
	 */
	getById(userId: string, interviewId: number): Promise<Interview | null>;

	/**
	 * Get all interviews for a user
	 */
	getAllByUserId(userId: string): Promise<Interview[]>;

	/**
	 * Update interview status
	 */
	updateStatus(
		userId: string,
		interviewId: number,
		status: InterviewStatus,
		client?: DatabaseClient,
	): Promise<Interview>;

	/**
	 * Delete interview and related data
	 */
	delete(userId: string, interviewId: number): Promise<void>;
}
