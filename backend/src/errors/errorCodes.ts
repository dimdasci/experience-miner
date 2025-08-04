/**
 * Minimal set of application error codes for consistent frontend handling
 */
export enum AppErrorCode {
	// Standard HTTP-aligned codes
	UNAUTHORIZED = "UNAUTHORIZED", // 401 - Authentication required
	FORBIDDEN = "FORBIDDEN", // 403 - Access denied
	NOT_FOUND = "NOT_FOUND", // 404 - Resource doesn't exist
	CONFLICT = "CONFLICT", // 409 - Resource conflict
	RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED", // 429 - Too many requests, throttle
	DUPLICATE_REQUEST = "DUPLICATE_REQUEST", // 429 - Same request in progress, ignore

	// Business-specific codes
	VALIDATION_FAILED = "VALIDATION_FAILED", // 400 - Field validation errors
	INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS", // 402 - Credits system
	AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE", // 503 - External service down

	// Catch-all
	INTERNAL_ERROR = "INTERNAL_ERROR", // 500 - Unexpected errors
}
