import type { Topic } from "@/types/domain/index.js";
import type { TopicQuestion } from "@/constants/initialTopics.js";
import type { DatabaseClient } from "@/providers/index.js";
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
	getById(userId: string,topicId: number): Promise<Topic | null>;

	/**
	 * Mark topic as used
	 */
	markAsUsed(userId: string, topicId: number): Promise<Topic>;

	/**
	 * Get available topics for user (status = 'available')
	 */
	getAvailable(userId: string): Promise<Topic[]>;

	/**
	 * Save multiple  topics
	 */
	createOrUpdate(userId: string, topics: Topic[], client?: DatabaseClient): Promise<void>;

	/**
	 * Update topic statuses in batch
	 */
	updateStatuses(
		userId: string,
		updates: Array<{ id: number; status: "available" | "used" | "irrelevant" }>,
		client?: DatabaseClient
	): Promise<void>;
}
