import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors } from "@/errors";
import type { AuthenticatedRequest } from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

/**
 * Functional HTTP handler for extracting structured facts from interview
 * Uses TaskEither composition and workflow for clean error handling
 */
export const extractFacts = wrapTaskEither((req: AuthenticatedRequest) => {
	const { id: interviewId } = req.params;
	const userId = req.user?.id;

	if (!userId) {
		return TE.left(AppErrors.unauthorized("Invalid user authentication"));
	}

	// Validate interviewId
	const interviewIdNumber = Number.parseInt(interviewId ?? "", 10);
	if (Number.isNaN(interviewIdNumber) || interviewIdNumber <= 0) {
		return TE.left(
			AppErrors.validationFailed(
				"interviewId",
				interviewId,
				"must be a positive integer",
			),
		);
	}

	// Execute workflow using functional composition
	const workflow = ServiceContainer.getInstance().getProcessInterviewWorkflow();

	return pipe(
		workflow.execute(userId, interviewIdNumber),
		TE.map(() => null), // Return null for successful completion
	);
}, "Interview extraction completed successfully");
