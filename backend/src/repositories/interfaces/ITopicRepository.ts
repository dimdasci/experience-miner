import type { Topic } from "@/types/database/index.js";
import type { TopicQuestion } from "@/constants/initialTopics.js";
import type { DatabaseClient } from "@/interfaces/providers/index.js";
/**
 * Repository interface for topic-related database operations
 */
export interface ITopicRepository {
	/**
	 * Create a new topic
	 */
	create(
		userId: string, 
		title: string, 
		motivationalQuote: string, 
		questions: TopicQuestion[], 
		status: string,
		client?: DatabaseClient): Promise<Topic>;

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
	 * Get available topics for user (status = 'available')
	 */
	getAvailable(userId: string): Promise<Topic[]>;

	/**
	 * Save multiple generated topics
	 */
	saveGenerated(topics: Topic[], client?: DatabaseClient): Promise<Topic[]>;

	/**
	 * Update topic statuses in batch
	 */
	updateStatuses(
		updates: Array<{ id: number; status: "available" | "used" | "irrelevant" }>,
		client?: DatabaseClient
	): Promise<void>;
}
