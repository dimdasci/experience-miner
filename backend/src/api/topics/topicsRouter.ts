import express from "express";
import * as TE from "fp-ts/lib/TaskEither";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors, BadRequestError } from "@/errors";
import {
	type AuthenticatedRequest,
	authenticateToken,
} from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

const topicsRouter = express.Router();

// GET /api/topics - List available topics for user with auto-seeding
topicsRouter.get(
	"/",
	authenticateToken,
	wrapTaskEither((req: AuthenticatedRequest) => {
		const userId = req.user?.id;
		if (!userId) {
			return TE.left(AppErrors.unauthorized("User not authenticated"));
		}

		const container = ServiceContainer.getInstance();
		const topicService = container.getTopicService();

		return topicService.getOrSeedTopics(userId);
	}, "Topics retrieved successfully"),
);

// POST /api/topics/{id}/select - Atomic topic selection and interview creation
topicsRouter.post(
	"/:id/select",
	authenticateToken,
	wrapTaskEither((req: AuthenticatedRequest) => {
		const topicIdParam = req.params.id;
		const userId = req.user?.id;

		if (!topicIdParam) {
			return TE.left(new BadRequestError("Topic ID is required"));
		}

		const topicId = Number.parseInt(topicIdParam, 10);
		if (Number.isNaN(topicId)) {
			return TE.left(new BadRequestError("Valid topic ID is required"));
		}

		if (!userId) {
			return TE.left(AppErrors.unauthorized("User not authenticated"));
		}

		const selectTopicWorkflow =
			ServiceContainer.getInstance().getSelectTopicWorkflow();

		return selectTopicWorkflow.execute(userId, topicId);
	}, "Topic selected and interview created"),
);

export { topicsRouter };
