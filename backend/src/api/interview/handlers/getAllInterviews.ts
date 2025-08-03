import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import type { AuthenticatedRequest } from "@/middleware/auth.js";

/**
 * HTTP handler for getting all interviews for authenticated user
 * Thin adapter that delegates to interview service
 */
export const getAllInterviews = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const userId = req.user?.id;

	if (!userId) {
		const serviceResponse = ServiceResponse.failure(
			"Invalid user authentication",
			null,
			StatusCodes.UNAUTHORIZED,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		const interviewRepo =
			ServiceContainer.getInstance().getInterviewRepository();
		const interviews = await interviewRepo.getAllByUserId(userId);

		const serviceResponse = ServiceResponse.success(
			"Interviews retrieved successfully",
			interviews,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		// Track error with full context
		Sentry.captureException(error, {
			contexts: {
				user: { id: userId },
				request: { endpoint: "GET /api/interviews" },
				operation: {
					name: "getAllInterviews",
					component: "ExperienceRouter",
				},
			},
		});
		const serviceResponse = ServiceResponse.failure(
			`Failed to retrieve interviews: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
