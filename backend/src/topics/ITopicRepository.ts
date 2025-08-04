import type * as TE from "fp-ts/lib/TaskEither.js";
import type { AppError } from "@/errors";
import type { DatabaseClient } from "@/providers";
import type { Topic, TopicQuestion } from "./types.js";

/**
 * Functional repository interface for topic-related database operations
 * Uses TaskEither for composable error handling
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
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Topic>;

	/**
	 * Get topics by user ID with optional status filter
	 */
	getByUserId(
		userId: string,
		status?: string,
	): TE.TaskEither<AppError, Topic[]>;

	/**
	 * Get topic by ID
	 */
	getById(userId: string, topicId: number): TE.TaskEither<AppError, Topic>;

	/**
	 * Mark topic as used
	 */
	markAsUsed(
		userId: string,
		topicId: number,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Topic>;

	/**
	 * Get available topics for user (status = 'available')
	 */
	getAvailable(userId: string): TE.TaskEither<AppError, Topic[]>;

	/**
	 * Save multiple topics
	 */
	createOrUpdate(
		userId: string,
		topics: Topic[],
		client?: DatabaseClient,
	): TE.TaskEither<AppError, void>;

	/**
	 * Update single topic status
	 */
	updateStatus(
		userId: string,
		topicId: number,
		status: "available" | "used" | "irrelevant",
		client?: DatabaseClient,
	): TE.TaskEither<AppError, void>;
}
