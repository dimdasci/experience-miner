import * as TE from "fp-ts/lib/TaskEither.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors } from "@/errors";
import type { AuthenticatedRequest } from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

/**
 * Functional HTTP handler for getting all interviews for authenticated user
 * Uses TaskEither composition for clean error handling
 */
export const getAllInterviews = wrapTaskEither((req: AuthenticatedRequest) => {
	const userId = req.user?.id;

	if (!userId) {
		return TE.left(AppErrors.unauthorized("Invalid user authentication"));
	}

	const interviewRepo = ServiceContainer.getInstance().getInterviewRepository();

	return interviewRepo.getAllByUserId(userId);
}, "Interviews retrieved successfully");
