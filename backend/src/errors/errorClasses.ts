import { StatusCodes } from "http-status-codes";
import { AppError } from "./appError.js";
import { AppErrorCode } from "./errorCodes.js";

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, StatusCodes.NOT_FOUND, AppErrorCode.NOT_FOUND, details);
	}
}

/**
 * Authentication and authorization errors (401/403)
 */
export class UnauthorizedError extends AppError {
	constructor(message: string, details?: unknown) {
		super(
			message,
			StatusCodes.UNAUTHORIZED,
			AppErrorCode.UNAUTHORIZED,
			details,
		);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, StatusCodes.FORBIDDEN, AppErrorCode.FORBIDDEN, details);
	}
}

/**
 * Validation and bad request errors (400)
 */
export class BadRequestError extends AppError {
	constructor(message: string, details?: unknown) {
		super(
			message,
			StatusCodes.BAD_REQUEST,
			AppErrorCode.VALIDATION_FAILED,
			details,
		);
	}
}

/**
 * Payment and credit system errors (402)
 */
export class PaymentRequiredError extends AppError {
	constructor(message: string, details?: unknown) {
		super(
			message,
			StatusCodes.PAYMENT_REQUIRED,
			AppErrorCode.INSUFFICIENT_CREDITS,
			details,
		);
	}
}

/**
 * Conflict errors for concurrent operations (409)
 */
export class ConflictError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, StatusCodes.CONFLICT, AppErrorCode.CONFLICT, details);
	}
}

/**
 * Rate limiting and request deduplication errors (429)
 */
export class TooManyRequestsError extends AppError {
	constructor(message: string, errorCode: AppErrorCode, details?: unknown) {
		super(message, StatusCodes.TOO_MANY_REQUESTS, errorCode, details);
	}
}

/**
 * External service unavailable errors (503)
 */
export class ServiceUnavailableError extends AppError {
	constructor(message: string, details?: unknown) {
		super(
			message,
			StatusCodes.SERVICE_UNAVAILABLE,
			AppErrorCode.AI_SERVICE_UNAVAILABLE,
			details,
		);
	}
}

/**
 * Internal server errors (500)
 */
export class InternalError extends AppError {
	constructor(message: string, details?: unknown) {
		super(
			message,
			StatusCodes.INTERNAL_SERVER_ERROR,
			AppErrorCode.INTERNAL_ERROR,
			details,
		);
	}
}
