import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceContainer } from "@/container/serviceContainer.js";

/**
 * HTTP handler for extracting structured facts from interview
 * Thin adapter that delegates to interview service
 */
export const extractFacts = async (
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

	// Validate interviewId
	const interviewIdNumber = parseInt(interviewId ?? "", 10);
	if (isNaN(interviewIdNumber) || interviewIdNumber <= 0) {
		const serviceResponse = ServiceResponse.failure(
			"Interview ID is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		const workflow = ServiceContainer.getInstance().getProcessInterviewWorkflow();
		await workflow.execute(
			userId,
			interviewIdNumber
		);

		const serviceResponse = ServiceResponse.success(
			"Interview extraction completed successfully",
			null,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

		if (error instanceof Error) {
			if (error.message === "Not enough credits") {
				statusCode = StatusCodes.PAYMENT_REQUIRED;
			} else if (error.message.includes("operation is in progress")) {
				statusCode = StatusCodes.CONFLICT;
			} else if (
				error.message.includes("not found") ||
				error.message.includes("Access denied")
			) {
				statusCode = StatusCodes.NOT_FOUND;
			} else if (error.message.includes("No answered questions")) {
				statusCode = StatusCodes.BAD_REQUEST;
			}
		}

		const serviceResponse = ServiceResponse.failure(
			`Failed to extract interview data: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
			null,
			statusCode,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
