import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectServiceResponse } from "../../test/helpers.js";
import { interviewRouter } from "./interviewRouter.js";

// Mock external dependencies and middleware that we can't reasonably test
vi.mock("@/common/middleware/auth.js", () => ({
	authenticateToken: vi.fn((req, _res, next) => {
		// Mock authenticated user for most tests
		(req as any).user = {
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
		saveAnswer: vi.fn(),
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
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question and interviewId are required",
			);
		});

		it("should return 400 when interviewId parameter is missing", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question and interviewId are required",
			);
		});

		it("should return 400 when both question and interviewId are missing", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question and interviewId are required",
			);
		});

		it("should return 400 when no audio file is provided", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
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

	describe("POST /extract - Request Validation", () => {
		it("should return 400 when question parameter is missing", async () => {
			const response = await request(app)
				.post("/api/interview/extract")
				.send({
					transcript: "Test transcript",
					interviewId: "1",
				})
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question and interviewId are required",
			);
		});

		it("should return 400 when interviewId parameter is missing", async () => {
			const response = await request(app)
				.post("/api/interview/extract")
				.send({
					transcript: "Test transcript",
					question: "Test question",
				})
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"Question and interviewId are required",
			);
		});

		it("should return 400 when transcript is missing", async () => {
			const response = await request(app)
				.post("/api/interview/extract")
				.send({
					question: "Test question",
					interviewId: "1",
				})
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"No transcript provided or invalid format",
			);
		});

		it("should return 400 when transcript is not a string", async () => {
			const response = await request(app)
				.post("/api/interview/extract")
				.send({
					transcript: 123,
					question: "Test question",
					interviewId: "1",
				})
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"No transcript provided or invalid format",
			);
		});

		it("should return 400 when transcript is empty string", async () => {
			const response = await request(app)
				.post("/api/interview/extract")
				.send({
					transcript: "",
					question: "Test question",
					interviewId: "1",
				})
				.expect(400);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe(
				"No transcript provided or invalid format",
			);
		});

		it("should accept valid transcript data", async () => {
			// This will fail at credits check, but validates request parsing
			const response = await request(app).post("/api/interview/extract").send({
				transcript: "This is a valid transcript with some content",
				question: "Test question",
				interviewId: "1",
			});

			// Should not fail due to missing params or invalid transcript
			expect(response.status).not.toBe(400);
		});

		it("should handle long transcripts", async () => {
			const longTranscript = "A".repeat(10000); // Very long transcript

			const response = await request(app).post("/api/interview/extract").send({
				transcript: longTranscript,
				question: "Test question",
				interviewId: "1",
			});

			// Should not fail due to transcript length
			expect(response.status).not.toBe(400);
		});
	});

	describe("Authentication Integration", () => {
		it("should require authentication for transcribe endpoint", async () => {
			// Mock auth middleware to simulate no user
			const { authenticateToken } = await import("@/common/middleware/auth.js");
			(authenticateToken as any).mockImplementationOnce(
				(req: any, _res: any, next: any) => {
					req.user = null; // Simulate no authenticated user
					next();
				},
			);

			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
				.attach("audio", Buffer.from("mock audio data"), "test-audio.webm")
				.expect(401);

			expectServiceResponse(response.body, false);
			expect(response.body.message).toBe("Invalid user authentication");
		});

		it("should require authentication for extract endpoint", async () => {
			// Mock auth middleware to simulate no user
			const { authenticateToken } = await import("@/common/middleware/auth.js");
			(authenticateToken as any).mockImplementationOnce(
				(req: any, _res: any, next: any) => {
					req.user = null; // Simulate no authenticated user
					next();
				},
			);

			const response = await request(app)
				.post("/api/interview/extract")
				.send({
					transcript: "Test transcript",
					question: "Test question",
					interviewId: "1",
				})
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
				// Missing interviewId
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
				.post("/api/interview/extract")
				.send({
					transcript: "Test transcript",
					// Missing question and interviewId
				})
				.expect(400);

			// Verify ServiceResponse structure
			expect(response.body).toHaveProperty("success", false);
			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("responseObject", null);
			expect(response.body).toHaveProperty("statusCode", 400);
		});
	});

	describe("Content-Type Handling", () => {
		it("should handle different audio mime types", async () => {
			const response = await request(app)
				.post("/api/interview/transcribe")
				.field("question", "Test question")
				.field("interviewId", "1")
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
