import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors, BadRequestError } from "@/errors";
import type { AuthenticatedRequest } from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

/**
 * Functional HTTP handler for updating answer by question number
 * Uses TaskEither composition for clean error handling
 */
export const updateAnswer = wrapTaskEither((req: AuthenticatedRequest) => {
	const { id: interviewId, questionNumber } = req.params;
	const { answer, recording_duration_seconds } = req.body;
	const userId = req.user?.id;

	if (!userId) {
		return TE.left(AppErrors.unauthorized("Invalid user authentication"));
	}

	// Validate parameters
	const interviewIdNumber = Number.parseInt(interviewId ?? "", 10);
	const questionNumberNumber = Number.parseInt(questionNumber ?? "", 10);

	if (
		Number.isNaN(interviewIdNumber) ||
		interviewIdNumber <= 0 ||
		Number.isNaN(questionNumberNumber) ||
		questionNumberNumber <= 0
	) {
		return TE.left(
			new BadRequestError("Interview ID and question number are required"),
		);
	}

	if (!answer || typeof answer !== "string") {
		return TE.left(new BadRequestError("Answer text is required"));
	}

	const answerService = ServiceContainer.getInstance().getAnswerService();

	return pipe(
		answerService.updateAnswer(
			interviewIdNumber,
			questionNumberNumber,
			userId,
			answer,
			recording_duration_seconds,
		),
	);
}, "Answer updated successfully");
