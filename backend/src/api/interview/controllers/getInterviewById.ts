import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { databaseService } from "@/services/databaseService.js";

export const getInterviewById = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const { id: interviewId } = req.params;
	const userId = req.user?.id;

	if (!userId) {
		const serviceResponse = ServiceResponse.failure(
			"Invalid user authentication",
			null,
			StatusCodes.UNAUTHORIZED,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	if (!interviewId) {
		const serviceResponse = ServiceResponse.failure(
			"Interview ID is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		// Get interview details
		const interview = await databaseService.getInterviewById(interviewId);

		if (!interview) {
			const serviceResponse = ServiceResponse.failure(
				"Interview not found",
				null,
				StatusCodes.NOT_FOUND,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Verify user owns this interview
		if (interview.user_id !== userId) {
			const serviceResponse = ServiceResponse.failure(
				"Access denied",
				null,
				StatusCodes.FORBIDDEN,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Get all answers for this interview
		const answers =
			await databaseService.getAnswersByInterviewIdBusiness(interviewId);

		const serviceResponse = ServiceResponse.success(
			"Interview retrieved successfully",
			{
				interview,
				answers,
			},
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		// Track error with context
		Sentry.captureException(error, {
			tags: { endpoint: "interview", operation: "get_interview_by_id" },
			contexts: {
				user: { id: userId },
				request: { interviewId },
			},
		});
		// Supplementary logging for development
		Sentry.logger?.error?.("Failed to get interview by ID", {
			user_id: userId,
			interview_id: interviewId,
			error: error instanceof Error ? error.message : String(error),
		});

		const serviceResponse = ServiceResponse.failure(
			`Failed to get interview: ${error instanceof Error ? error.message : "Unknown error"}`,
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
