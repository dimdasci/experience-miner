import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";

export const errorHandler = (
	error: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	console.error("Unhandled error:", error);

	let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
	let message = "Internal Server Error";

	// Handle specific error types
	if (error.name === "ValidationError") {
		statusCode = StatusCodes.BAD_REQUEST;
		message = "Invalid request data";
	} else if (error.name === "UnauthorizedError") {
		statusCode = StatusCodes.UNAUTHORIZED;
		message = "Unauthorized access";
	} else if (
		error.message &&
		(error.message.includes("Gemini") || error.message.includes("AI"))
	) {
		statusCode = StatusCodes.SERVICE_UNAVAILABLE;
		message = "AI service temporarily unavailable";
	}

	const serviceResponse = ServiceResponse.failure(message, null, statusCode);
	res.status(statusCode).json(serviceResponse);
};
