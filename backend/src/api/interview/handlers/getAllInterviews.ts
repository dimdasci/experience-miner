import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { getInterviewService } from "@/services/interviewService.js";

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
		const interviews = await getInterviewService().getAllInterviews(userId);

		const serviceResponse = ServiceResponse.success(
			"Interviews retrieved successfully",
			interviews,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
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
