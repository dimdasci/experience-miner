import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
	createMockNext,
	createMockRequest,
	createMockResponse,
} from "../../test/setup.js";
import { errorHandler } from "./errorHandler.js";

describe("Error Handler Middleware", () => {
	let req: Request;
	let res: Response;
	let next: NextFunction;

	beforeEach(() => {
		req = createMockRequest();
		res = createMockResponse();
		next = createMockNext();
	});

	it("should handle generic errors with 500 status", () => {
		const error = new Error("Generic server error");

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Internal Server Error",
			responseObject: null,
			statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
		});
	});

	it("should handle ValidationError with 400 status", () => {
		const error = new Error("Invalid input data");
		error.name = "ValidationError";

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Invalid request data",
			responseObject: null,
			statusCode: StatusCodes.BAD_REQUEST,
		});
	});

	it("should handle UnauthorizedError with 401 status", () => {
		const error = new Error("Access denied");
		error.name = "UnauthorizedError";

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Unauthorized access",
			responseObject: null,
			statusCode: StatusCodes.UNAUTHORIZED,
		});
	});

	it("should handle Gemini API errors with 503 status", () => {
		const error = new Error("Gemini service is down");

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.SERVICE_UNAVAILABLE);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "AI service temporarily unavailable",
			responseObject: null,
			statusCode: StatusCodes.SERVICE_UNAVAILABLE,
		});
	});

	it("should handle AI-related errors with 503 status", () => {
		const error = new Error("AI processing failed");

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.SERVICE_UNAVAILABLE);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "AI service temporarily unavailable",
			responseObject: null,
			statusCode: StatusCodes.SERVICE_UNAVAILABLE,
		});
	});

	it("should log errors to console", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const error = new Error("Test error for logging");

		errorHandler(error, req, res, next);

		expect(consoleSpy).toHaveBeenCalledWith("Unhandled error:", error);

		consoleSpy.mockRestore();
	});

	it("should not call next function", () => {
		const error = new Error("Test error");

		errorHandler(error, req, res, next);

		expect(next).not.toHaveBeenCalled();
	});

	it("should return ServiceResponse format", () => {
		const error = new Error("Test error");

		errorHandler(error, req, res, next);

		// Access mock calls in a way that works with our typed Response
		const mockJson = res.json as Mock;
		expect(mockJson.mock.calls.length).toBeGreaterThan(0);
		const jsonCall = mockJson.mock.calls[0]?.[0];
		expect(jsonCall).toHaveProperty("success", false);
		expect(jsonCall).toHaveProperty("message");
		expect(jsonCall).toHaveProperty("responseObject");
		expect(jsonCall).toHaveProperty("statusCode");
	});

	it("should handle errors without message gracefully", () => {
		const error = {} as Error; // Error without message

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Internal Server Error",
			}),
		);
	});
});
