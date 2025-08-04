import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors, BadRequestError } from "@/errors";
import type { AuthenticatedRequest } from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

/**
 * Functional HTTP handler for getting interview by ID with answers
 * Uses TaskEither composition for clean error handling
 */
export const getInterviewById = wrapTaskEither((req: AuthenticatedRequest) => {
	const { id: interviewId } = req.params;
	const userId = req.user?.id;

	Sentry.logger?.info?.("Interview requested", {
		user_id: userId,
		interviewId,
	});

	if (!userId) {
		return TE.left(AppErrors.unauthorized("Invalid user authentication"));
	}

	// Validate interviewId
	const interviewIdNumber = Number.parseInt(interviewId ?? "", 10);
	if (Number.isNaN(interviewIdNumber) || interviewIdNumber <= 0) {
		Sentry.logger?.error?.("Invalid interview ID", {
			user_id: userId,
			interviewId,
		});
		return TE.left(new BadRequestError("Interview ID is required"));
	}

	const interviewRepo = ServiceContainer.getInstance().getInterviewRepository();
	const answerRepo = ServiceContainer.getInstance().getAnswerRepository();

	return pipe(
		// Get interview and answers in parallel
		TE.Do,
		TE.bind("interview", () =>
			interviewRepo.getById(userId, interviewIdNumber),
		),
		TE.bind("answers", () =>
			answerRepo.getByInterviewId(userId, interviewIdNumber),
		),
		TE.flatMap(({ interview, answers }) => {
			if (!interview) {
				return TE.left(AppErrors.notFound("Interview", interviewIdNumber));
			}

			Sentry.logger?.info?.("Interview retrieved successfully", {
				user_id: userId,
				interviewId: interviewIdNumber,
				answerCount: answers.length,
			});

			return TE.right({ interview, answers });
		}),
	);
}, "Interview retrieved successfully");
