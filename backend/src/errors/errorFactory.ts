import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	InternalError,
	NotFoundError,
	PaymentRequiredError,
	ServiceUnavailableError,
	TooManyRequestsError,
	UnauthorizedError,
} from "./errorClasses.js";
import { AppErrorCode } from "./errorCodes.js";

/**
 * Factory functions for common error scenarios
 */
export const AppErrors = {
	// Standard HTTP errors
	unauthorized: (reason?: string) =>
		new UnauthorizedError(reason || "Authentication required"),

	forbidden: (reason?: string) =>
		new ForbiddenError(reason || "Access forbidden"),

	notFound: (resource: string, id: string | number) =>
		new NotFoundError(`${resource} not found`, { resource, id }),

	conflict: (reason: string, details?: unknown) =>
		new ConflictError(reason, details),

	// Rate limiting scenarios
	rateLimitExceeded: (retryAfterSeconds: number) =>
		new TooManyRequestsError(
			`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds`,
			AppErrorCode.RATE_LIMIT_EXCEEDED,
			{ retryAfter: retryAfterSeconds },
		),

	duplicateRequest: (requestId?: string) =>
		new TooManyRequestsError(
			"Duplicate request detected",
			AppErrorCode.DUPLICATE_REQUEST,
			{ requestId },
		),

	// Business-specific errors
	validationFailed: (field: string, value: unknown, constraint: string) =>
		new BadRequestError(`Validation failed for ${field}: ${constraint}`, {
			field,
			value,
			constraint,
		}),

	insufficientCredits: (available: number) =>
		new PaymentRequiredError("Insufficient credits for this operation", {
			available,
		}),

	aiServiceUnavailable: (provider?: string) =>
		new ServiceUnavailableError(
			provider
				? `${provider} service temporarily unavailable`
				: "AI service temporarily unavailable",
		),

	// Generic errors
	internalError: (message: string, details?: unknown) =>
		new InternalError(message, details),
};
