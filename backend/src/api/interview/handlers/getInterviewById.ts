import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceContainer } from "@/container/serviceContainer.js";

/**
 * HTTP handler for getting interview by ID with answers
 * Thin adapter that delegates to interview service
 */
export const getInterviewById = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const { id: interviewId } = req.params;
	const userId = req.user?.id;

	Sentry.logger?.info?.("Interview requested", {
		user_id: userId,
		interviewId,
	});

	if (!userId) {
		const serviceResponse = ServiceResponse.failure(
			"Invalid user authentication",
			null,
			StatusCodes.UNAUTHORIZED,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	// convert to integer
	const interviewIdNumber = parseInt(interviewId ?? "", 10);
	if (Number.isNaN(interviewIdNumber) || interviewIdNumber <= 0) {
		Sentry.logger?.error?.("Invalid interview ID", {
			user_id: userId,
			interviewId,
		});
		const serviceResponse = ServiceResponse.failure(
			"Interview ID is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		const interviewRepo =
			ServiceContainer.getInstance().getInterviewRepository();
		const answerRepo =
			ServiceContainer.getInstance().getAnswerRepository();

		const interview = await interviewRepo.getById(userId, interviewIdNumber);
		const answers = await answerRepo.getByInterviewId(userId, interviewIdNumber);
		Sentry.logger?.info?.("Interview retrieved", {
			user_id: userId,
			interviewId: interviewIdNumber,
			result: { interview, answers },
		});

		if (!interview) {
			const serviceResponse = ServiceResponse.failure(
				"Interview not found",
				null,
				StatusCodes.NOT_FOUND,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		const serviceResponse = ServiceResponse.success(
			"Interview retrieved successfully",
			{ interview, answers },
		);


		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

		if (error instanceof Error && error.message === "Access denied") {
			statusCode = StatusCodes.FORBIDDEN;
		}

		const serviceResponse = ServiceResponse.failure(
			`Failed to retrieve interview: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
			null,
			statusCode,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
