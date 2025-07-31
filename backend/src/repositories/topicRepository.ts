import * as Sentry from "@sentry/node";
import type { IDatabaseProvider, DatabaseClient } from "@/interfaces/providers/index.js";
import type { Topic } from "@/types/database/index.js";
import type { ITopicRepository } from "./interfaces/index.js";
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
		const query = `INSERT INTO topics (user_id, title, motivational_quote, questions, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		 RETURNING *`;
		const params = [
			userId,
			title,
			motivationalQuote,
			JSON.stringify(questions),
			status,
		];

		let result: Topic[];
		if (client) {
			const resultRaw = await client.query<Topic>(query, params);
			result = resultRaw.rows;
		} else {
			result = await this.db.query<Topic>(query, params);
		}

		if (!result || result.length === 0) {
			throw new Error("Topic insert failed - no rows returned");
		}

		const topic = result[0];
		if (!topic) {
			throw new Error("Topic insert returned empty row");
		}

		return topic;
	}

	async getByUserId(userId: string, status?: string): Promise<Topic[]> {
		const sql = status
			? "SELECT * FROM topics WHERE user_id = $1 AND status = $2 ORDER BY created_at ASC"
			: "SELECT * FROM topics WHERE user_id = $1 ORDER BY created_at ASC";

		const params = status ? [userId, status] : [userId];

		return await this.db.query<Topic>(sql, params);
	}

	async getById(topicId: number): Promise<Topic | null> {
		const result = await this.db.query<Topic>(
			"SELECT * FROM topics WHERE id = $1",
			[topicId],
		);

		return result.length > 0 ? (result[0] ?? null) : null;
	}

	async markAsUsed(topicId: number): Promise<Topic> {
		const result = await this.db.query<Topic>(
			`UPDATE topics 
			 SET status = 'used', updated_at = NOW() 
			 WHERE id = $1 
			 RETURNING *`,
			[topicId],
		);

		if (!result || result.length === 0) {
			throw new Error("Topic update failed - topic not found");
		}

		const topic = result[0];
		if (!topic) {
			throw new Error("Topic update returned empty row");
		}

		return topic;
	}

	async getAvailable(userId: string): Promise<Topic[]> {
		return this.getByUserId(userId, "available");
	}

	async saveGenerated(topics: Topic[], client?: DatabaseClient): Promise<Topic[]> {
		if (topics.length === 0) {
			return [];
		}

		const savedTopics: Topic[] = [];
		for (const topic of topics) {
			try {
				const savedTopic = await this.create(
					topic.user_id,
					topic.title,
					topic.motivational_quote,
					topic.questions,
					topic.status,
					client
				);
				savedTopics.push(savedTopic);

				Sentry.logger?.debug?.("Generated topic saved to database", {
					topicId: savedTopic.id,
					title: savedTopic.title,
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
		return savedTopics;
	}

	async updateStatuses(
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
				 WHERE id = $2`,
					[update.status, update.id],
				);

				Sentry.logger?.debug?.("Topic status updated", {
					topicId: update.id,
					newStatus: update.status,
				});
			} catch (error) {
				Sentry.logger?.error?.("Failed to update topic status", {
					topicId: update.id,
					status: update.status,
					error: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		}
	}
}
