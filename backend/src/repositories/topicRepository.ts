import * as Sentry from "@sentry/node";
import type { IDatabaseProvider, DatabaseClient } from "@/providers";
import type { Topic } from "@/types/domain";
import type { ITopicRepository } from "./interfaces";
import type { TopicQuestion } from "@/constants/initialTopics.js";
/**
 * PostgreSQL implementation of topic repository
 */
export class TopicRepository implements ITopicRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	async create(userId: string, title: string, motivationalQuote: string, questions: TopicQuestion[], status: string, client?: DatabaseClient): Promise<Topic> {
		const db = client ?? this.db;

		const result = await db.query<Topic>(
			`INSERT INTO topics (user_id, title, motivational_quote, questions, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		 RETURNING *`,
			[userId, title, motivationalQuote, JSON.stringify(questions), status],
		);

		return this.db.getFirstRowOrThrow(result, "Topic insert failed - no rows returned");
	}

	async getByUserId(userId: string, status?: string): Promise<Topic[]> {
		const sql = status
			? "SELECT * FROM topics WHERE user_id = $1 AND status = $2 ORDER BY created_at ASC"
			: "SELECT * FROM topics WHERE user_id = $1 ORDER BY created_at ASC";

		const params = status ? [userId, status] : [userId];

		const result = await this.db.query<Topic>(sql, params);
		return result.rows.length > 0 ? result.rows : [];
	}

	async getById(userId: string, topicId: number): Promise<Topic> {
		const result = await this.db.query<Topic>(
			"SELECT * FROM topics WHERE id = $1 AND user_id = $2",
			[topicId, userId],
		);

		return this.db.getFirstRowOrThrow(result, "Topic not found");
	}

	async markAsUsed(userId: string, topicId: number): Promise<Topic> {
		const result = await this.db.query<Topic>(
			`UPDATE topics 
			 SET status = 'used', updated_at = NOW() 
			 WHERE id = $1 AND user_id = $2
			 RETURNING *`,
			[topicId, userId],
		);

		return this.db.getFirstRowOrThrow(result, "Failed to mark topic as used");
	}

	async getAvailable(userId: string): Promise<Topic[]> {
		return this.getByUserId(userId, "available");
	}

	async createOrUpdate(userId: string, topics: Topic[], client?: DatabaseClient): Promise<void> {
		if (topics.length === 0) {
			return;
		}

		for (const topic of topics) {
			try {
				if (topic.id === undefined) {
					await this.create(
						topic.user_id,
						topic.title,
						topic.motivational_quote,
						topic.questions,
						topic.status,
						client
					);
				} else {
					await this.updateStatuses(
						userId,
						[{ id: topic.id, status: topic.status }],
						client
					);
				}

				Sentry.logger?.debug?.("Topic is persisted", {
					action: topic.id ? "updated" : "created",
					topicId: topic.id,
					title: topic.title,
					userId: topic.user_id,
				});
			} catch (error) {
				Sentry.logger?.error?.("Failed to save generated topic", {
					title: topic.title,
					userId: topic.user_id,
					error: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		}
	}

	async updateStatuses(
		userId: string,
		updates: Array<{ id: number; status: "available" | "used" | "irrelevant" }>,
		client?: DatabaseClient
	): Promise<void> {
		if (updates.length === 0) {
			return;
		}
		const db = client ?? this.db;
		for (const update of updates) {
			try {
				await db.query(
					`UPDATE topics 
				 SET status = $1, updated_at = NOW() 
				 WHERE id = $2 AND user_id = $3`,
					[update.status, update.id, userId],
				);

				Sentry.logger?.debug?.("Topic status updated", {
					topicId: update.id,
					newStatus: update.status,
				});
			} catch (error) {
				Sentry.logger?.error?.("Failed to update topic status", {
					userId: userId,
					topicId: update.id,
					status: update.status,
					error: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		}
	}
}
