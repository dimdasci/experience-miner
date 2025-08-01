import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceContainer } from "@/container/serviceContainer.js";


/**
 * HTTP handler for updating answer by question number
 * Thin adapter that delegates to interview service
 */
export const updateAnswer = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const { id: interviewId, questionNumber } = req.params;
	const { answer, recording_duration_seconds } = req.body;
	const userId = req.user?.id;

	if (!userId) {
		const serviceResponse = ServiceResponse.failure(
			"Invalid user authentication",
			null,
			StatusCodes.UNAUTHORIZED,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	// convert interviewId and questionNumber to numbers
	const interviewIdNumber = parseInt(interviewId ?? "", 10);
	const questionNumberNumber = parseInt(questionNumber ?? "", 10);

	if (isNaN(interviewIdNumber) || interviewIdNumber <= 0 || isNaN(questionNumberNumber) || questionNumberNumber <= 0) {
		const serviceResponse = ServiceResponse.failure(
			"Interview ID and question number are required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	if (!answer || typeof answer !== "string") {
		const serviceResponse = ServiceResponse.failure(
			"Answer text is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		const interviewService = ServiceContainer.getInstance().getInterviewService();
		const updatedAnswer = await interviewService.updateAnswer(
			interviewIdNumber,
			questionNumberNumber,
			userId,
			answer,
			recording_duration_seconds,
		);

		const serviceResponse = ServiceResponse.success(
			"Answer updated successfully",
			updatedAnswer,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		// Track error with full context
		Sentry.captureException(error, {
			contexts: {
				user: { id: userId },
				request: { endpoint: `PUT /api/interviews/${interviewId}/answers/${questionNumber}` },
				operation: {
					name: "updateAnswer",
					component: "ExperienceRouter",
				},
			},
		});

		let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

		if (error instanceof Error) {
			if (
				error.message.includes("found") ||
				error.message.includes("Access denied")
			) {
				statusCode = StatusCodes.NOT_FOUND;
			}
		}

		const serviceResponse = ServiceResponse.failure(
			`Failed to update answer: ${error instanceof Error ? error.message : "Unknown error"
			}`,
			null,
			statusCode,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
