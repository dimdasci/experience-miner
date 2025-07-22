import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { healthCheckRouter } from "./healthCheckRouter.js";

describe("Health Check Router", () => {
	let app: express.Application;

	beforeEach(() => {
		app = express();
		app.use("/health", healthCheckRouter);
	});

	describe("GET /", () => {
		it("should return health status with service information", async () => {
			const response = await request(app).get("/health").expect(200);

			expect(response.body).toHaveProperty("success", true);
			expect(response.body).toHaveProperty("message", "Service is healthy");
			expect(response.body).toHaveProperty("responseObject");

			const { responseObject } = response.body;
			expect(responseObject).toHaveProperty("uptime");
			expect(responseObject).toHaveProperty("timestamp");
			expect(responseObject).toHaveProperty("environment");

			expect(typeof responseObject.uptime).toBe("number");
			expect(responseObject.uptime).toBeGreaterThanOrEqual(0);
			expect(responseObject.timestamp).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
			);
			expect(responseObject.environment).toBe("test");
		});

		it("should include proper response structure", async () => {
			const response = await request(app).get("/health").expect(200);

			expect(response.body).toEqual({
				success: true,
				message: "Service is healthy",
				responseObject: expect.objectContaining({
					uptime: expect.any(Number),
					timestamp: expect.any(String),
					environment: "test",
				}),
				statusCode: expect.any(Number),
			});
		});
	});

	describe("GET /railway", () => {
		it("should return Railway-specific health check", async () => {
			const response = await request(app).get("/health/railway").expect(200);

			expect(response.body).toEqual({
				status: "healthy",
				service: "experience-miner-backend",
				timestamp: expect.stringMatching(
					/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
				),
			});
		});

		it("should return different format from standard health check", async () => {
			const standardResponse = await request(app).get("/health").expect(200);

			const railwayResponse = await request(app)
				.get("/health/railway")
				.expect(200);

			// Railway response should not have ServiceResponse structure
			expect(railwayResponse.body).not.toHaveProperty("success");
			expect(railwayResponse.body).not.toHaveProperty("responseObject");

			// Standard response should have ServiceResponse structure
			expect(standardResponse.body).toHaveProperty("success");
			expect(standardResponse.body).toHaveProperty("responseObject");
		});
	});

	describe("response headers", () => {
		it("should return JSON content type", async () => {
			await request(app)
				.get("/health")
				.expect("Content-Type", /json/)
				.expect(200);
		});

		it("should return JSON content type for Railway endpoint", async () => {
			await request(app)
				.get("/health/railway")
				.expect("Content-Type", /json/)
				.expect(200);
		});
	});
});
