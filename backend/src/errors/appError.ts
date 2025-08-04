import type { AppErrorCode } from "./errorCodes.js";

/**
 * Base application error class with structured error information
 */
export abstract class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode: AppErrorCode;
	public readonly details?: unknown;
	public readonly isOperational = true;

	constructor(
		message: string,
		statusCode: number,
		errorCode: AppErrorCode,
		details?: unknown,
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;

		// Ensures proper stack trace in V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
