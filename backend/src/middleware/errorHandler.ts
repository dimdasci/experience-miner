import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import { AppError, AppErrorCode } from "@/errors";
import type { AuthenticatedRequest } from "./auth.js";

/**
 * Centralized error handling middleware
 * Handles AppError instances and maps legacy errors to proper responses
 */
export const errorHandler = (
	error: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	// Generate request correlation ID for tracking
	const correlationId = Array.isArray(req.headers["x-correlation-id"])
		? req.headers["x-correlation-id"][0]
		: req.headers["x-correlation-id"] ||
			`req_${Date.now()}_${Math.random().toString(36).slice(2)}`;

	// Extract user context for logging and Sentry
	const userId = (req as AuthenticatedRequest).user?.id;
	const userEmail = (req as AuthenticatedRequest).user?.email;
	const userPrefix = userEmail?.split("@")[0] ?? "anonymous";

	// Set Sentry context
	Sentry.withScope((scope) => {
		scope.setTag("correlation_id", correlationId);
		scope.setUser({
			id: userId,
			email: userEmail,
		});
		scope.setContext("request", {
			method: req.method,
			url: req.url,
			headers: req.headers,
			body: req.body,
		});

		let statusCode: number;
		let errorCode: AppErrorCode;
		let message: string;
		let details: unknown = null;

		if (error instanceof AppError) {
			// Handle structured application errors
			statusCode = error.statusCode;
			errorCode = error.errorCode;
			message = error.message;
			details = error.details;

			// Only log to Sentry if it's an unexpected error (5xx)
			if (statusCode >= 500) {
				scope.setLevel("error");
				Sentry.captureException(error);
			} else {
				scope.setLevel("warning");
				// Log business logic errors as breadcrumbs, not exceptions
				Sentry.addBreadcrumb({
					message: error.message,
					level: "warning",
					data: { errorCode, details },
				});
			}
		} else {
			// Handle legacy and unknown errors
			statusCode = mapUnknownErrorToStatusCode(error);
			errorCode = mapUnknownErrorToErrorCode(error);
			message = mapUnknownErrorToMessage(error);

			// Always capture unknown errors
			scope.setLevel("error");
			scope.setTag("error_type", "legacy");
			Sentry.captureException(error);
		}

		// Structured logging
		console.error("Error handled:", {
			correlationId,
			userId,
			user: userPrefix,
			statusCode,
			errorCode,
			message,
			details,
			stack: error.stack,
			url: req.url,
			method: req.method,
		});

		// Send standardized error response
		const serviceResponse = ServiceResponse.failure(
			message,
			details,
			statusCode,
			errorCode,
		);

		res.status(statusCode).json(serviceResponse);
	});
};

/**
 * Maps unknown error types to HTTP status codes
 * Should only handle truly unexpected errors since all application errors should use AppError
 */
function mapUnknownErrorToStatusCode(_error: Error): number {
	// All known application errors should now use AppError instances
	// This function only handles unexpected/unknown errors
	return StatusCodes.INTERNAL_SERVER_ERROR;
}

/**
 * Maps unknown error types to application error codes
 * Should only handle truly unexpected errors since all application errors should use AppError
 */
function mapUnknownErrorToErrorCode(_error: Error): AppErrorCode {
	// All known application errors should now use AppError instances
	// This function only handles unexpected/unknown errors
	return AppErrorCode.INTERNAL_ERROR;
}

/**
 * Maps unknown error types to user-friendly messages
 * Should only handle truly unexpected errors since all application errors should use AppError
 */
function mapUnknownErrorToMessage(_error: Error): string {
	// All known application errors should now use AppError instances
	// This function only handles unexpected/unknown errors
	return "Internal server error";
}
