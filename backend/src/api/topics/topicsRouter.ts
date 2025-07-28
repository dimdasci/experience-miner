import * as Sentry from "@sentry/node";
import express from "express";
import {
	type AuthenticatedRequest,
	authenticateToken,
} from "@/common/middleware/auth.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import type {
	Answer as BusinessAnswer,
	Topic,
	TopicSelectionResponse,
} from "@/common/types/business.js";
import { database } from "@/common/utils/database.js";
import { INITIAL_TOPICS } from "@/constants/initialTopics.js";
import { databaseService } from "@/services/databaseService.js";

const topicsRouter = express.Router();

// GET /api/topics - List available topics for user with auto-seeding
topicsRouter.get(
	"/",
	authenticateToken,
	async (req: AuthenticatedRequest, res) => {
		const userId = req.user?.id;
		if (!userId) {
			return res
				.status(401)
				.json(ServiceResponse.failure("User not authenticated", null, 401));
		}

		try {
			// Get existing topics for user
			let topics = await databaseService.getTopicsByUserId(userId);

			// If no topics exist, seed with initial topics
			if (topics.length === 0) {
				Sentry.logger?.info?.("Seeding initial topics for new user", {
					user_id: userId,
					topic_count: INITIAL_TOPICS.length,
				});

				const seededTopics: Topic[] = [];
				for (const initialTopic of INITIAL_TOPICS) {
					const topic = await databaseService.createTopic({
						userId,
						title: initialTopic.title,
						motivational_quote: initialTopic.motivational_quote,
						questions: initialTopic.questions,
						status: "available",
					});
					seededTopics.push(topic);
				}
				topics = seededTopics;
			}

			// Add question count to response
			const topicsWithCounts = topics.map((topic) => ({
				...topic,
				questionCount: Array.isArray(topic.questions)
					? topic.questions.length
					: 0,
			}));

			return res.json(
				ServiceResponse.success(
					"Topics retrieved successfully",
					topicsWithCounts,
				),
			);
		} catch (error) {
			// Track error with context
			Sentry.captureException(error, {
				tags: { endpoint: "topics", operation: "get_topics" },
				contexts: { user: { id: userId } },
			});
			// Supplementary logging for development
			Sentry.logger?.error?.("Failed to retrieve topics", {
				user_id: userId,
				error: error instanceof Error ? error.message : String(error),
			});
			return res
				.status(500)
				.json(ServiceResponse.failure("Failed to retrieve topics", null, 500));
		}
	},
);

// POST /api/topics/{id}/select - Atomic topic selection and interview creation
topicsRouter.post(
	"/:id/select",
	authenticateToken,
	async (req: AuthenticatedRequest, res) => {
		const topicIdParam = req.params.id;
		const userId = req.user?.id;

		if (!topicIdParam) {
			return res
				.status(400)
				.json(ServiceResponse.failure("Topic ID is required", null, 400));
		}

		const topicId = parseInt(topicIdParam, 10);
		if (Number.isNaN(topicId)) {
			return res
				.status(400)
				.json(ServiceResponse.failure("Valid topic ID is required", null, 400));
		}

		if (!userId) {
			return res
				.status(401)
				.json(ServiceResponse.failure("User not authenticated", null, 401));
		}

		const client = await database.getClient();

		try {
			await client.query("BEGIN");

			// 1. Verify topic exists and is available
			const topic = await databaseService.getTopicById(topicId);
			if (!topic) {
				await client.query("ROLLBACK");
				return res
					.status(404)
					.json(ServiceResponse.failure("Topic not found", null, 404));
			}

			if (topic.user_id !== userId) {
				await client.query("ROLLBACK");
				return res
					.status(403)
					.json(ServiceResponse.failure("Topic not accessible", null, 403));
			}

			if (topic.status !== "available") {
				await client.query("ROLLBACK");
				return res
					.status(400)
					.json(ServiceResponse.failure("Topic is not available", null, 400));
			}

			// 2. Mark topic as used
			await databaseService.markTopicAsUsedWithTransaction(client, topicId);

			// 3. Create interview
			const interview = await databaseService.createInterviewWithTransaction(
				client,
				{
					userId,
					title: topic.title,
					motivational_quote: topic.motivational_quote,
				},
			);

			// 4. Create answer records from topic questions
			const answers: BusinessAnswer[] = [];
			const questions = Array.isArray(topic.questions) ? topic.questions : [];

			for (const question of questions) {
				const answer = await databaseService.createAnswerWithTransaction(
					client,
					{
						interviewId: interview.id,
						userId,
						questionNumber: question.order,
						question: question.text,
					},
				);
				answers.push(answer);
			}

			await client.query("COMMIT");

			const response: TopicSelectionResponse = {
				interview,
				answers,
			};

			return res.json(
				ServiceResponse.success(
					"Topic selected and interview created",
					response,
				),
			);
		} catch (error) {
			await client.query("ROLLBACK");
			// Track error with context
			Sentry.captureException(error, {
				tags: { endpoint: "topics", operation: "select_topic" },
				contexts: {
					user: { id: userId },
					request: { topicId },
				},
			});
			// Supplementary logging for development
			Sentry.logger?.error?.("Failed to select topic", {
				user_id: userId,
				topic_id: topicId,
				error: error instanceof Error ? error.message : String(error),
			});
			return res
				.status(500)
				.json(ServiceResponse.failure("Failed to select topic", null, 500));
		} finally {
			client.release();
		}
	},
);

export { topicsRouter };
