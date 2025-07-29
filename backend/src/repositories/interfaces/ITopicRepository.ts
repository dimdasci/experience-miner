import type { PoolClient } from "pg";
import type { CreateTopicParams, Topic } from "@/types/database/index.js";

/**
 * Repository interface for topic-related database operations
 */
export interface ITopicRepository {
	/**
	 * Create a new topic
	 */
	create(params: CreateTopicParams): Promise<Topic>;

	/**
	 * Get topics by user ID with optional status filter
	 */
	getByUserId(userId: string, status?: string): Promise<Topic[]>;

	/**
	 * Get topic by ID
	 */
	getById(topicId: number): Promise<Topic | null>;

	/**
	 * Mark topic as used
	 */
	markAsUsed(topicId: number): Promise<Topic>;

	/**
	 * Mark topic as used within a transaction
	 */
	markAsUsedWithTransaction(
		client: PoolClient,
		topicId: number,
	): Promise<Topic>;

	/**
	 * Get available topics for user (status = 'available')
	 */
	getAvailable(userId: string): Promise<Topic[]>;

	/**
	 * Save multiple generated topics
	 */
	saveGenerated(topics: Topic[]): Promise<Topic[]>;

	/**
	 * Update topic statuses in batch
	 */
	updateStatuses(
		updates: Array<{ id: number; status: "available" | "used" | "irrelevant" }>,
	): Promise<void>;
}
