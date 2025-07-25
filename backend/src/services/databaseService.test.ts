import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "@/common/utils/database.js";
import { databaseService } from "./databaseService.js";

// Mock the database utility
vi.mock("@/common/utils/database.js", () => ({
	database: {
		query: vi.fn(),
		getClient: vi.fn(),
	},
}));

describe("DatabaseService - Business Logic Error Handling", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Error Handling", () => {
		it("should throw error when topic creation fails", async () => {
			vi.mocked(database.query).mockResolvedValue([]);

			await expect(
				databaseService.createTopic({
					userId: "user-1",
					title: "Test Topic",
					motivational_quote: "Test quote",
					questions: [],
					status: "available",
				}),
			).rejects.toThrow("Topic insert failed - no rows returned");
		});

		it("should return null when topic not found", async () => {
			vi.mocked(database.query).mockResolvedValue([]);

			const result = await databaseService.getTopicById("nonexistent");

			expect(result).toBeNull();
		});

		it("should throw error when topic update fails", async () => {
			vi.mocked(database.query).mockResolvedValue([]);

			await expect(databaseService.markTopicAsUsed("topic-1")).rejects.toThrow(
				"Topic update failed - no rows returned",
			);
		});
	});
});
