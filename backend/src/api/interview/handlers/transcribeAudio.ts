import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { getInterviewService } from "@/services/interviewService.js";

/**
 * HTTP handler for transcribing audio to text
 * Thin adapter that delegates to interview service
 */
export const transcribeAudio = async (
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

	if (!req.file) {
		const serviceResponse = ServiceResponse.failure(
			"Audio file is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	try {
		const result = await getInterviewService().transcribeAudio(
			req.file.buffer,
			req.file.mimetype,
			userId,
		);

		const serviceResponse = ServiceResponse.success(
			"Audio transcribed successfully",
			result,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

		if (error instanceof Error) {
			if (error.message === "Not enough credits") {
				statusCode = StatusCodes.PAYMENT_REQUIRED;
			} else if (error.message.includes("operation is in progress")) {
				statusCode = StatusCodes.CONFLICT;
			}
		}

		const serviceResponse = ServiceResponse.failure(
			`Failed to transcribe audio: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
			null,
			statusCode,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
};
