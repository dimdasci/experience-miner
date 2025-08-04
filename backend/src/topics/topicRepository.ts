import * as Sentry from "@sentry/node";
import * as A from "fp-ts/lib/Array.js";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { AppError } from "@/errors";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { ITopicRepository } from "./ITopicRepository";
import type { Topic, TopicQuestion } from "./types.js";

/**
 * PostgreSQL implementation of topic repository using purely functional patterns
 * Following the golden standard established by CreditsRepository
 */
export class TopicRepository implements ITopicRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	create(
		userId: string,
		title: string,
		motivationalQuote: string,
		questions: TopicQuestion[],
		status: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Topic> {
		const db = client || this.db;
		const insertQuery = `INSERT INTO topics (user_id, title, motivational_quote, questions, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		 RETURNING *`;

		return db.queryFirst<Topic>(insertQuery, [
			userId,
			title,
			motivationalQuote,
			JSON.stringify(questions),
			status,
		]);
	}

	getByUserId(
		userId: string,
		status?: string,
	): TE.TaskEither<AppError, Topic[]> {
		const sql = status
			? "SELECT * FROM topics WHERE user_id = $1 AND status = $2 ORDER BY created_at ASC"
			: "SELECT * FROM topics WHERE user_id = $1 ORDER BY created_at ASC";

		const params = status ? [userId, status] : [userId];

		return pipe(
			this.db.query<Topic>(sql, params),
			TE.map((result) => result.rows),
		);
	}

	getById(userId: string, topicId: number): TE.TaskEither<AppError, Topic> {
		return this.db.queryFirst<Topic>(
			"SELECT * FROM topics WHERE id = $1 AND user_id = $2",
			[topicId, userId],
		);
	}

	markAsUsed(
		userId: string,
		topicId: number,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, Topic> {
		const db = client || this.db;
		const updateQuery = `UPDATE topics 
			 SET status = 'used', updated_at = NOW() 
			 WHERE id = $1 AND user_id = $2
			 RETURNING *`;

		return db.queryFirst<Topic>(updateQuery, [topicId, userId]);
	}

	getAvailable(userId: string): TE.TaskEither<AppError, Topic[]> {
		return this.getByUserId(userId, "available");
	}

	createOrUpdate(
		userId: string,
		topics: Topic[],
		client?: DatabaseClient,
	): TE.TaskEither<AppError, void> {
		// Early validation
		if (topics.length === 0) {
			return TE.right(undefined);
		}

		// Create a functional pipeline that processes each topic
		const processTopics: TE.TaskEither<AppError, undefined[]> = pipe(
			topics,
			A.map(
				(topic): TE.TaskEither<AppError, undefined> =>
					pipe(
						topic.id === undefined
							? pipe(
									this.create(
										topic.user_id,
										topic.title,
										topic.motivational_quote,
										topic.questions,
										topic.status,
										client,
									),
									TE.map((_: Topic): void => undefined),
								)
							: this.updateStatus(userId, topic.id, topic.status, client),
						TE.map((): undefined => {
							Sentry.logger?.debug?.("Topic is persisted", {
								action: topic.id ? "updated" : "created",
								topicId: topic.id,
								title: topic.title,
								userId: topic.user_id,
							});
						}),
						TE.mapLeft((error: AppError): AppError => {
							Sentry.logger?.error?.("Failed to save generated topic", {
								title: topic.title,
								userId: topic.user_id,
								error: error instanceof Error ? error.message : String(error),
							});
							return error;
						}),
					),
			),
			A.sequence(TE.ApplicativePar),
		);

		return pipe(
			processTopics,
			TE.map((): void => undefined),
		);
	}

	updateStatus(
		userId: string,
		topicId: number,
		status: "available" | "used" | "irrelevant",
		client?: DatabaseClient,
	): TE.TaskEither<AppError, void> {
		const db = client || this.db;
		const updateQuery = `UPDATE topics 
			 SET status = $1, updated_at = NOW() 
			 WHERE id = $2 AND user_id = $3`;

		return pipe(
			db.query(updateQuery, [status, topicId, userId]),
			TE.map((): void => {
				Sentry.logger?.debug?.("Topic status updated", {
					topicId,
					newStatus: status,
				});
			}),
			TE.mapLeft((error: AppError): AppError => {
				Sentry.logger?.error?.("Failed to update topic status", {
					userId,
					topicId,
					status,
					error: error instanceof Error ? error.message : String(error),
				});
				return error;
			}),
		);
	}
}
