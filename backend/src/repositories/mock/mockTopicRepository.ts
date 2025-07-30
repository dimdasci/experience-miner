import type { PoolClient } from "pg";
import type { CreateTopicParams, Topic } from "@/types/database/index.js";
import type { ITopicRepository } from "../interfaces/index.js";

/**
 * Mock implementation of topic repository for testing
 */
export class MockTopicRepository implements ITopicRepository {
	private topics: Topic[] = [];
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used in create method for ID generation
	private nextId = 1;

	/**
	 * Get current topics (for testing/debugging)
	 */
	getAll(): Topic[] {
		return [...this.topics];
	}

	/**
	 * Clear all topics (for test cleanup)
	 */
	clear(): void {
		this.topics = [];
		this.nextId = 1;
	}

	/**
	 * Set initial topics (for test setup)
	 */
	setTopics(topics: Topic[]): void {
		this.topics = topics.map((topic) => ({
			...topic,
			id: topic.id || this.nextId++,
		}));
	}

	async create(params: CreateTopicParams): Promise<Topic> {
		const topic: Topic = {
			id: this.nextId++,
			user_id: params.userId,
			title: params.title,
			motivational_quote: params.motivational_quote,
			questions: params.questions,
			status: params.status,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		this.topics.push(topic);
		return topic;
	}

	async getByUserId(userId: string, status?: string): Promise<Topic[]> {
		let filtered = this.topics.filter((topic) => topic.user_id === userId);

		if (status) {
			filtered = filtered.filter((topic) => topic.status === status);
		}

		return filtered.sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);
	}

	async getById(topicId: number): Promise<Topic | null> {
		return this.topics.find((topic) => topic.id === topicId) || null;
	}

	async markAsUsed(topicId: number): Promise<Topic> {
		const topic = this.topics.find((t) => t.id === topicId);
		if (!topic) {
			throw new Error("Topic not found");
		}

		topic.status = "used";
		topic.updated_at = new Date().toISOString();
		return topic;
	}

	async markAsUsedWithTransaction(
		_client: PoolClient,
		topicId: number,
	): Promise<Topic> {
		// For mock, transaction client is ignored
		return this.markAsUsed(topicId);
	}

	async getAvailable(userId: string): Promise<Topic[]> {
		return this.getByUserId(userId, "available");
	}

	async saveGenerated(topics: Topic[]): Promise<Topic[]> {
		const savedTopics: Topic[] = [];

		for (const topic of topics) {
			const createParams: CreateTopicParams = {
				userId: topic.user_id,
				title: topic.title,
				motivational_quote: topic.motivational_quote,
				questions: topic.questions,
				status: topic.status,
			};

			const savedTopic = await this.create(createParams);
			savedTopics.push(savedTopic);
		}

		return savedTopics;
	}

	async updateStatuses(
		updates: Array<{ id: number; status: "available" | "used" | "irrelevant" }>,
	): Promise<void> {
		for (const update of updates) {
			const topic = this.topics.find((t) => t.id === update.id);
			if (topic) {
				topic.status = update.status;
				topic.updated_at = new Date().toISOString();
			}
		}
	}
}
