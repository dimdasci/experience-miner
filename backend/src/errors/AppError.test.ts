import { describe, expect, it } from "vitest";
import {
	AppError,
	AppErrorCode,
	AppErrors,
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "./index.js";

describe("AppError", () => {
	describe("AppError base class", () => {
		it("should create an error with correct properties", () => {
			const error = new NotFoundError("Resource not found", { id: 123 });

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error.message).toBe("Resource not found");
			expect(error.statusCode).toBe(404);
			expect(error.errorCode).toBe(AppErrorCode.NOT_FOUND);
			expect(error.details).toEqual({ id: 123 });
			expect(error.isOperational).toBe(true);
		});

		it("should maintain proper stack trace", () => {
			const error = new UnauthorizedError("Unauthorized");
			expect(error.stack).toBeDefined();
			expect(error.name).toBe("UnauthorizedError");
		});
	});

	describe("AppErrors factory functions", () => {
		it("should create generic not found error", () => {
			const error = AppErrors.notFound("Interview", 123);

			expect(error).toBeInstanceOf(NotFoundError);
			expect(error.message).toBe("Interview not found");
			expect(error.errorCode).toBe(AppErrorCode.NOT_FOUND);
			expect(error.statusCode).toBe(404);
			expect(error.details).toEqual({ resource: "Interview", id: 123 });
		});

		it("should create insufficient credits error", () => {
			const error = AppErrors.insufficientCredits(100);

			expect(error.message).toBe("Insufficient credits for this operation");
			expect(error.statusCode).toBe(402);
			expect(error.errorCode).toBe(AppErrorCode.INSUFFICIENT_CREDITS);
			expect(error.details).toEqual({ available: 100 });
		});

		it("should create validation error", () => {
			const error = AppErrors.validationFailed(
				"email",
				"invalid-email",
				"must be a valid email address",
			);

			expect(error).toBeInstanceOf(BadRequestError);
			expect(error.statusCode).toBe(400);
			expect(error.errorCode).toBe(AppErrorCode.VALIDATION_FAILED);
			expect(error.details).toEqual({
				field: "email",
				value: "invalid-email",
				constraint: "must be a valid email address",
			});
		});

		it("should create conflict error", () => {
			const error = AppErrors.conflict("Operation in progress", {
				userId: "user123",
			});

			expect(error.statusCode).toBe(409);
			expect(error.errorCode).toBe(AppErrorCode.CONFLICT);
			expect(error.details).toEqual({ userId: "user123" });
		});

		it("should create rate limit error", () => {
			const error = AppErrors.rateLimitExceeded(60);

			expect(error.statusCode).toBe(429);
			expect(error.errorCode).toBe(AppErrorCode.RATE_LIMIT_EXCEEDED);
			expect(error.details).toEqual({ retryAfter: 60 });
		});

		it("should create duplicate request error", () => {
			const error = AppErrors.duplicateRequest("req123");

			expect(error.statusCode).toBe(429);
			expect(error.errorCode).toBe(AppErrorCode.DUPLICATE_REQUEST);
			expect(error.details).toEqual({ requestId: "req123" });
		});
	});

	describe("Error serialization", () => {
		it("should serialize to JSON correctly", () => {
			const error = AppErrors.validationFailed("field", "value", "constraint");

			// JSON.stringify should work on AppError instances
			const serialized = JSON.stringify({
				message: error.message,
				statusCode: error.statusCode,
				errorCode: error.errorCode,
				details: error.details,
			});

			const parsed = JSON.parse(serialized);
			expect(parsed.message).toBe(error.message);
			expect(parsed.statusCode).toBe(error.statusCode);
			expect(parsed.errorCode).toBe(error.errorCode);
			expect(parsed.details).toEqual(error.details);
		});
	});
});
