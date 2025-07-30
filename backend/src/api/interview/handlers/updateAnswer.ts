import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { InterviewService } from "@/services/interviewService.js";

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

	if (!interviewId || !questionNumber) {
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
		const interviewService = new InterviewService();
		const updatedAnswer = await interviewService.updateAnswer(
			interviewId,
			parseInt(questionNumber, 10),
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
		let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

		if (error instanceof Error) {
			if (
				error.message.includes("not found") ||
				error.message.includes("Access denied")
			) {
				statusCode = StatusCodes.NOT_FOUND;
			} else if (error.message === "Question not found") {
				statusCode = StatusCodes.BAD_REQUEST;
			}
		}

		const serviceResponse = ServiceResponse.failure(
			`Failed to update answer: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
			null,
			statusCode,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
