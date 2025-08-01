import * as Sentry from "@sentry/node";
import express from "express";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import {
	type AuthenticatedRequest,
	authenticateToken,
} from "@/common/middleware/auth.js";
import { INITIAL_TOPICS } from "@/constants/initialTopics.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import type { Topic } from "@/types/domain";

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
			const container = ServiceContainer.getInstance();
			const topicRepository = container.getTopicRepository();
			let topics = await topicRepository.getByUserId(userId);

			// If no topics exist, seed with initial topics
			if (topics.length === 0) {
				Sentry.logger?.info?.("Seeding initial topics for new user", {
					user_id: userId,
					topic_count: INITIAL_TOPICS.length,
				});

				const seededTopics: Topic[] = [];
				for (const initialTopic of INITIAL_TOPICS) {
					const topic = await topicRepository.create(
						userId,
						initialTopic.title,
						initialTopic.motivational_quote,
						initialTopic.questions,
						"available",
					);
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

		try {
			const selectTopicWorkflow =
				ServiceContainer.getInstance().getSelectTopicWorkflow();

			const result = await selectTopicWorkflow.execute(userId, topicId);
			return res.json(
				ServiceResponse.success("Topic selected and interview created", result),
			);
		} catch (error) {
			Sentry.captureException(error, {
				tags: { endpoint: "topics", operation: "select_topic" },
				contexts: {
					user: { id: userId },
					request: { topicId },
				},
			});
			Sentry.logger?.error?.("Failed to select topic", {
				user_id: userId,
				topic_id: topicId,
				error: error instanceof Error ? error.message : String(error),
			});
			return res
				.status(500)
				.json(ServiceResponse.failure("Failed to select topic", null, 500));
		}
	},
);

export { topicsRouter };
