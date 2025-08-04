import type { IRouter } from "express";
import { Router } from "express";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors } from "@/errors";
import type { AuthenticatedRequest } from "@/middleware/auth.js";
import { authenticateToken } from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

export const experienceRouter: IRouter = Router();

// Get user's experience data
experienceRouter.get(
	"/",
	authenticateToken,
	wrapTaskEither((req: AuthenticatedRequest) => {
		const userId = req.user?.id;

		if (!userId) {
			return TE.left(AppErrors.unauthorized("Invalid user authentication"));
		}

		const container = ServiceContainer.getInstance();
		const experienceRepo = container.getExperienceRepository();

		return pipe(
			experienceRepo.getByUserId(userId),
			TE.flatMap((experienceRecord) => {
				// Check if we have usable experience data
				if (!experienceRecord.payload) {
					return TE.left(AppErrors.notFound("Experience data", userId));
				}

				// Return the extracted facts
				return TE.right({ extractedFacts: experienceRecord.payload });
			}),
			TE.orElse(() => {
				// Unify not found cases - no record or no payload both mean "no experience data"
				return TE.left(AppErrors.notFound("Experience data", userId));
			}),
		);
	}, "Experience data retrieved successfully"),
);
