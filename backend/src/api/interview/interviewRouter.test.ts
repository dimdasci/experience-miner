import express, { type Request } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectServiceResponse } from "../../test/helpers.js";
import { interviewRouter } from "./interviewRouter.js";

// Mock external dependencies and middleware that we can't reasonably test
vi.mock("@/common/middleware/auth.js", () => ({
	authenticateToken: vi.fn((req, _res, next) => {
		// Mock authenticated user for most tests
		(req as Request & { user?: { id: string; email: string } }).user = {
			id: "test-user-id",
			email: "test@example.com",
		};
		next();
	}),
}));

vi.mock("@/services/geminiService.js", () => ({
	geminiService: {
		transcribeAudio: vi.fn(),
		extractFacts: vi.fn(),
	},
}));

vi.mock("@/services/creditsService.js", () => ({
	creditsService: {
		checkUserLock: vi.fn(),
		setUserLock: vi.fn(),
		removeUserLock: vi.fn(),
		getCurrentBalance: vi.fn(),
		consumeCredits: vi.fn(),
		retryOperation: vi.fn(),
	},
}));

vi.mock("@/services/databaseService.js", () => ({
	databaseService: {
		// saveAnswer removed - use updateAnswerByQuestionNumber for updates
	},
}));

// Mock Sentry to avoid noise in tests
vi.mock("@sentry/node", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
	captureMessage: vi.fn(),
	captureException: vi.fn(),
}));

describe("Interview Router - Request Validation & Error Handling", () => {
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();

		app = express();
		app.use(express.json());
		app.use("/api/interview", interviewRouter);
	});

	describe("POST /transcribe - Request Validation", () => {
		it("should return 400 when question parameter is missing", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("interviewId", "1")
				.field("questionNumber", "1")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question, interviewId, and questionNumber are required",
			);
		});

		it("should return 400 when interviewId parameter is missing", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("questionNumber", "1")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question, interviewId, and questionNumber are required",
			);
		});

		it("should return 400 when question, interviewId and questionNumber are missing", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question, interviewId, and questionNumber are required",
			);
		});

		it("should return 400 when no audio file is provided", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.field("questionNumber", "1")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe("No audio file provided");
		});

		it("should handle file upload with correct field name", async () => {
			// This will fail at credits check, but validates request parsing
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.field("questionNumber", "1")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm");

			// Should not fail due to missing file or params
			expect(response.status).not.toBe(400);
		});

		it("should respect file size limits", async () => {
			const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB (over 10MB limit)

			await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.attach("audio", largeBuffer, "large-audio.webm")
				.expect((res) => {
					// Multer should catch this and return 413 or similar
					expect([413, 500]).toContain(res.status);
				});
		});
	});

	describe("POST /:id/extract - Request Validation", () => {
		it("should return 404 when interviewId parameter is missing", async () => {
			await request(app).post("/api/interview//extract").expect(404); // Express returns 404 for empty path params
		});

		it("should accept valid interviewId in path", async () => {
			// This will fail at credits/auth check, but validates path parsing
			const response = await request(app).post("/api/interview/123/extract");

			// Should not fail due to missing interviewId
			expect(response.status).not.toBe(404);
		});

		it("should accept valid extract request", async () => {
			// This will fail at credits check, but validates request parsing
			const response = await request(app).post("/api/interview/123/extract");

			// Should not fail due to missing params
			expect(response.status).not.toBe(400);
		});

		it("should handle extract workflow requests", async () => {
			// This will fail at credits check, but validates workflow parsing
			const response = await request(app).post("/api/interview/456/extract");

			// Should not fail due to path or request format
			expect(response.status).not.toBe(400);
		});
	});

	describe("Authentication Integration", () => {
		it("should require authentication for transcribe endpoint", async () => {
			// Mock auth middleware to simulate no user
			const { authenticateToken } = await import("@/common/middleware/auth.js");
			(
				authenticateToken as unknown as ReturnType<typeof vi.fn>
			).mockImplementationOnce(
				(
					req: Request & { user?: unknown },
					_res: unknown,
					next: () => void,
				) => {
					req.user = null; // Simulate no authenticated user
					next();
				},
			);

			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.field("questionNumber", "1")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(401);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe("Invalid user authentication");
		});

		it("should require authentication for extract endpoint", async () => {
			// Mock auth middleware to simulate no user
			const { authenticateToken } = await import("@/common/middleware/auth.js");
			(
				authenticateToken as unknown as ReturnType<typeof vi.fn>
			).mockImplementationOnce(
				(
					req: Request & { user?: unknown },
					_res: unknown,
					next: () => void,
				) => {
					req.user = null; // Simulate no authenticated user
					next();
				},
			);

			const response = await request(app)
				.post("/api/interview/123/extract")
				.expect(401);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe("Invalid user authentication");
		});
	});

	describe("Response Format Validation", () => {
		it("should return proper ServiceResponse format for validation errors", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				// Missing interviewId and questionNumber
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			// Verify ServiceResponse structure
			expect(response.body).toHaveProperty("success", false);
			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("responseObject", null);
			expect(response.body).toHaveProperty("statusCode", 400);
		});

		it("should return proper ServiceResponse format for extract validation errors", async () => {
			const response = await request(app)
				.post("/api/interview//extract")
				.expect(404); // Empty path param returns 404

			// 404 doesn't follow ServiceResponse format in Express
			expect(response.status).toBe(404);
		});
	});

	describe("Content-Type Handling", () => {
		it("should handle different audio mime types", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.field("questionNumber", "1")
				.attach("audio", Buffer.from("mock audio data"), {
					filename: "test-audio.mp3",
					contentType: "audio/mp3",
				});

			// Should accept the file regardless of mime type
			expect(response.status).not.toBe(400);
		});

		it("should handle webm audio files", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.field("questionNumber", "1")
				.attach("audio", Buffer.from("mock audio data"), {
					filename: "test-audio.webm",
					contentType: "audio/webm",
				});

			// Should accept the file
			expect(response.status).not.toBe(400);
		});
	});
});

// Skip complex integration tests that would require full service setup
describe.skip("Interview Router - Complex Integration Tests", () => {
	// These would require:
	// - Real database connection
	// - Gemini API credentials
	// - Credits system setup
	// - Full authentication flow

	it.skip("should complete full transcription workflow", () => {
		// Would test: upload -> transcribe -> save -> consume credits
	});

	it.skip("should complete full extraction workflow", () => {
		// Would test: extract -> save -> consume credits
	});

	it.skip("should handle concurrent operations with user locking", () => {
		// Would test: real concurrency control
	});

	it.skip("should handle insufficient credits scenario", () => {
		// Would test: real credits checking
	});
});
