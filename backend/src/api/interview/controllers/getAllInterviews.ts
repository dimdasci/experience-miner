import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { databaseService } from "@/services/databaseService.js";

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
		const interviews = await databaseService.getAllInterviewsByUserId(userId);

		const serviceResponse = ServiceResponse.success(
			"Interviews retrieved successfully",
			interviews,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		// Track error with context
		Sentry.captureException(error, {
			tags: { endpoint: "interview", operation: "get_all_interviews" },
			contexts: { user: { id: userId } },
		});
		// Supplementary logging for development
		Sentry.logger?.error?.("Failed to get interviews", {
			user_id: userId,
			error: error instanceof Error ? error.message : String(error),
		});

		const serviceResponse = ServiceResponse.failure(
			`Failed to get interviews: ${error instanceof Error ? error.message : "Unknown error"}`,
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
