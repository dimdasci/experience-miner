import express, { type Request } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectServiceResponse } from "../../test/helpers.js";
import { topicsRouter } from "./topicsRouter.js";

// Mock external dependencies
vi.mock("@/common/middleware/auth.js", () => ({
	authenticateToken: vi.fn((req, _res, next) => {
		(req as Request & { user?: { id: string; email: string } }).user = {
			id: "test-user-id",
			email: "test@example.com",
		};
		next();
	}),
}));

vi.mock("@/services/databaseService.js", () => ({
	databaseService: {
		getTopicsByUserId: vi.fn(),
		createTopic: vi.fn(),
		getTopicById: vi.fn(),
		markTopicAsUsedWithTransaction: vi.fn(),
		createInterviewWithTransaction: vi.fn(),
		createAnswerWithTransaction: vi.fn(),
	},
}));

vi.mock("@/common/utils/database.js", () => ({
	database: {
		getClient: vi.fn(),
	},
}));

import { database } from "@/common/utils/database.js";
import { databaseService } from "@/services/databaseService.js";

describe("Topics Router", () => {
	let app: express.Application;
	let mockClient: {
		query: ReturnType<typeof vi.fn>;
		release: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		app = express();
		app.use(express.json());
		app.use("/topics", topicsRouter);
		vi.clearAllMocks();

		// Mock database client for transactions
		mockClient = {
			query: vi.fn(),
			release: vi.fn(),
		};
		vi.mocked(database.getClient).mockResolvedValue(
			mockClient as unknown as Awaited<ReturnType<typeof database.getClient>>,
		);
	});

	describe("GET /topics", () => {
		it("should return existing topics when user has topics", async () => {
			const mockTopics = [
				{
					id: "topic-1",
					user_id: "test-user-id",
					title: "Test Topic",
					motivational_quote: "Test quote",
					questions: [
						{ text: "Q1", order: 1 },
						{ text: "Q2", order: 2 },
					],
					status: "available" as const,
					created_at: "2023-01-01",
					updated_at: "2023-01-01",
				},
			];

			vi.mocked(databaseService.getTopicsByUserId).mockResolvedValue(
				mockTopics,
			);

			const response = await request(app).get("/topics");

			expect(response.status).toBe(200);
			expectServiceResponse(response.body, true);
			expect(response.body.responseObject).toHaveLength(1);
			expect(response.body.responseObject[0]).toMatchObject({
				...mockTopics[0],
				questionCount: 2,
			});
		});

		it("should seed initial topics for new users", async () => {
			const mockSeededTopic = {
				id: "seeded-topic-1",
				user_id: "test-user-id",
				title:
					"Career Story: share your professional journey in your own words",
				motivational_quote: "Test quote",
				questions: [{ text: "Q1", order: 1 }],
				status: "available" as const,
				created_at: "2023-01-01",
				updated_at: "2023-01-01",
			};

			vi.mocked(databaseService.getTopicsByUserId).mockResolvedValue([]);
			vi.mocked(databaseService.createTopic).mockResolvedValue(mockSeededTopic);

			const response = await request(app).get("/topics");

			expect(response.status).toBe(200);
			expectServiceResponse(response.body, true);
			expect(databaseService.createTopic).toHaveBeenCalledTimes(3); // 3 initial topics
			expect(response.body.responseObject).toHaveLength(3);
		});

		it("should handle database errors gracefully", async () => {
			vi.mocked(databaseService.getTopicsByUserId).mockRejectedValue(
				new Error("Database error"),
			);

			const response = await request(app).get("/topics");

			expect(response.status).toBe(500);
			expectServiceResponse(response.body, false);
		});
	});

	describe("POST /topics/:id/select", () => {
		it("should successfully select topic and create interview with atomic transaction", async () => {
			const mockTopic = {
				id: "topic-1",
				user_id: "test-user-id",
				title: "Test Topic",
				motivational_quote: "Test quote",
				status: "available" as const,
				questions: [
					{ text: "Question 1", order: 1 },
					{ text: "Question 2", order: 2 },
				],
				created_at: "2023-01-01",
				updated_at: "2023-01-01",
			};

			const mockInterview = {
				id: 1,
				user_id: "test-user-id",
				title: "Test Topic",
				motivational_quote: "Test quote",
				status: "draft" as const,
				created_at: "2023-01-01",
				updated_at: "2023-01-01",
			};

			const mockAnswers = [
				{
					id: "answer-1",
					interview_id: 1,
					user_id: "test-user-id",
					question_number: 1,
					question: "Question 1",
					answer: "",
					recording_duration_seconds: null,
					created_at: "2023-01-01",
					updated_at: "2023-01-01",
				},
				{
					id: "answer-2",
					interview_id: 1,
					user_id: "test-user-id",
					question_number: 2,
					question: "Question 2",
					answer: "",
					recording_duration_seconds: null,
					created_at: "2023-01-01",
					updated_at: "2023-01-01",
				},
			];

			vi.mocked(databaseService.getTopicById).mockResolvedValue(mockTopic);
			vi.mocked(
				databaseService.createInterviewWithTransaction,
			).mockResolvedValue(mockInterview);
			vi.mocked(databaseService.createAnswerWithTransaction)
				.mockResolvedValueOnce(
					mockAnswers[0] as unknown as import("@/common/types/business.js").Answer,
				)
				.mockResolvedValueOnce(
					mockAnswers[1] as unknown as import("@/common/types/business.js").Answer,
				);

			const response = await request(app).post("/topics/topic-1/select");

			expect(response.status).toBe(200);
			expectServiceResponse(response.body, true);
			expect(response.body.responseObject).toMatchObject({
				interview: mockInterview,
				answers: mockAnswers,
			});
		});

		it("should return 404 when topic not found", async () => {
			vi.mocked(databaseService.getTopicById).mockResolvedValue(null);

			const response = await request(app).post(
				"/topics/nonexistent-topic/select",
			);

			expect(response.status).toBe(404);
			expectServiceResponse(response.body, false);
		});

		it("should return 403 when topic belongs to different user", async () => {
			const mockTopic = {
				id: "topic-1",
				user_id: "different-user-id", // Different user
				title: "Test Topic",
				motivational_quote: "Test quote",
				status: "available" as const,
				questions: [],
				created_at: "2023-01-01",
				updated_at: "2023-01-01",
			};

			vi.mocked(databaseService.getTopicById).mockResolvedValue(mockTopic);

			const response = await request(app).post("/topics/topic-1/select");

			expect(response.status).toBe(403);
			expectServiceResponse(response.body, false);
		});

		it("should return 400 when topic already used", async () => {
			const mockTopic = {
				id: "topic-1",
				user_id: "test-user-id",
				title: "Test Topic",
				motivational_quote: "Test quote",
				status: "used" as const, // Already used
				questions: [],
				created_at: "2023-01-01",
				updated_at: "2023-01-01",
			};

			vi.mocked(databaseService.getTopicById).mockResolvedValue(mockTopic);

			const response = await request(app).post("/topics/topic-1/select");

			expect(response.status).toBe(400);
			expectServiceResponse(response.body, false);
		});

		it("should handle database errors gracefully", async () => {
			const mockTopic = {
				id: "topic-1",
				user_id: "test-user-id",
				title: "Test Topic",
				motivational_quote: "Test quote",
				status: "available" as const,
				questions: [{ text: "Q1", order: 1 }],
				created_at: "2023-01-01",
				updated_at: "2023-01-01",
			};

			vi.mocked(databaseService.getTopicById).mockResolvedValue(mockTopic);
			vi.mocked(
				databaseService.markTopicAsUsedWithTransaction,
			).mockRejectedValue(new Error("Database error"));

			const response = await request(app).post("/topics/topic-1/select");

			expect(response.status).toBe(500);
			expectServiceResponse(response.body, false);
		});

		it("should reject requests without topic ID", async () => {
			const response = await request(app).post("/topics//select");

			expect(response.status).toBe(404);
		});
	});
});
