import { beforeAll, describe, expect, it } from "vitest";
import { database } from "@/common/connections/databaseConnection.js";

describe("Database Connection", () => {
	beforeAll(async () => {
		// Ensure database connection is available for tests
		// This is a simple integration test to verify basic connectivity
	});

	it("should connect to database successfully", async () => {
		// Simple query to test connection
		const result = await database.query("SELECT 1 as test");

		expect(result).toBeDefined();
		expect(result.length).toBe(1);
		expect(result[0]).toHaveProperty("test", 1);
	});

	it("should handle database queries with parameters", async () => {
		// Test parameterized queries work correctly
		const testValue = "test-value";
		const result = await database.query("SELECT $1 as value", [testValue]);

		expect(result).toBeDefined();
		expect(result.length).toBe(1);
		expect(result[0]).toHaveProperty("value", testValue);
	});
});
