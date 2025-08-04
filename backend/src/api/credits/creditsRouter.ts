import type { IRouter } from "express";
import { Router } from "express";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors } from "@/errors";
import {
	type AuthenticatedRequest,
	authenticateToken,
} from "@/middleware/auth.js";
import { logger } from "@/middleware/requestLogger.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

export const creditsRouter: IRouter = Router();

// Get current user credits balance
creditsRouter.get(
	"/",
	authenticateToken,
	wrapTaskEither((req: AuthenticatedRequest) => {
		const userId = req.user?.id;
		const userPrefix = req.user?.email?.split("@")[0] ?? "unknown";

		if (!userId) {
			return TE.left(AppErrors.unauthorized("Invalid user authentication"));
		}

		const container = ServiceContainer.getInstance();
		const creditsRepo = container.getCreditsRepository();

		return pipe(
			creditsRepo.getCurrentBalance(userId),
			TE.map((credits) => {
				logger.info("Credits balance retrieved", {
					user_id: userId,
					user: userPrefix,
					credits,
				});
				return { credits };
			}),
		);
	}, "Credits retrieved successfully"),
);
