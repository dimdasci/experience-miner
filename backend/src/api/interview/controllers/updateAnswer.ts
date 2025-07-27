import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { databaseService } from "@/services/databaseService.js";

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

	if (!interviewId || !questionNumber) {
		const serviceResponse = ServiceResponse.failure(
			"Interview ID and question number are required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	if (answer === undefined || answer === null) {
		const serviceResponse = ServiceResponse.failure(
			"Answer is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		// Verify interview exists and user owns it
		const interview = await databaseService.getInterviewById(interviewId);

		if (!interview) {
			const serviceResponse = ServiceResponse.failure(
				"Interview not found",
				null,
				StatusCodes.NOT_FOUND,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		if (interview.user_id !== userId) {
			const serviceResponse = ServiceResponse.failure(
				"Access denied",
				null,
				StatusCodes.FORBIDDEN,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		const questionNum = parseInt(questionNumber, 10);
		if (Number.isNaN(questionNum)) {
			const serviceResponse = ServiceResponse.failure(
				"Invalid question number",
				null,
				StatusCodes.BAD_REQUEST,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Update the answer
		const updatedAnswer = await databaseService.updateAnswerByQuestionNumber(
			parseInt(interviewId, 10),
			questionNum,
			answer,
			recording_duration_seconds,
		);

		const serviceResponse = ServiceResponse.success(
			"Answer updated successfully",
			updatedAnswer,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		// Track error with context
		Sentry.captureException(error, {
			tags: { endpoint: "interview", operation: "update_answer" },
			contexts: {
				user: { id: userId },
				request: { interviewId, questionNumber },
			},
		});
		// Supplementary logging for development
		Sentry.logger?.error?.("Failed to update answer", {
			user_id: userId,
			interview_id: interviewId,
			question_number: questionNumber,
			error: error instanceof Error ? error.message : String(error),
		});

		const serviceResponse = ServiceResponse.failure(
			`Failed to update answer: ${error instanceof Error ? error.message : "Unknown error"}`,
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
