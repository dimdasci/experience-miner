import * as Sentry from "@sentry/node";
import type { IRouter } from "express";
import { type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { authenticateToken } from "@/common/middleware/auth.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { databaseService } from "@/services/databaseService.js";

export const experienceRouter: IRouter = Router();

// Get user's experience data
experienceRouter.get(
	"/",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.id;

		if (!userId) {
			const serviceResponse = ServiceResponse.failure(
				"Invalid user authentication",
				null,
				StatusCodes.UNAUTHORIZED,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		try {
			Sentry.logger?.info?.("Experience data request started", {
				user_id: userId,
				endpoint: "GET /api/experience",
			});

			const experienceRecord =
				await databaseService.getExperienceByUserId(userId);

			if (!experienceRecord) {
				// Return empty experience data structure if none exists
				const emptyExperience = {
					extractedFacts: {
						achievements: [],
						companies: [],
						projects: [],
						roles: [],
						skills: [],
						summary: {
							text: "",
							lastUpdated: new Date().toISOString(),
							basedOnInterviews: [],
						},
						metadata: {
							totalExtractions: 0,
							lastExtractionAt: null,
							creditsUsed: 0,
						},
					},
				};

				Sentry.logger?.info?.("Experience data retrieved (empty)", {
					user_id: userId,
					hasData: false,
				});

				const serviceResponse = ServiceResponse.success(
					"Experience data retrieved (empty)",
					emptyExperience,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			Sentry.logger?.info?.("Experience data retrieved successfully", {
				user_id: userId,
				hasData: true,
				extractionCount:
					experienceRecord.summary?.extractedFacts?.metadata
						?.totalExtractions || 0,
			});

			const serviceResponse = ServiceResponse.success(
				"Experience data retrieved successfully",
				experienceRecord.summary,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			// Track error with full context
			Sentry.captureException(error, {
				tags: { endpoint: "experience", operation: "get_experience_data" },
				contexts: {
					user: { id: userId },
					request: { endpoint: "GET /api/experience" },
				},
			});
			// Supplementary logging for user journey analysis
			Sentry.logger?.error?.("Experience data retrieval failed", {
				user_id: userId,
				endpoint: "GET /api/experience",
				error: error instanceof Error ? error.message : String(error),
			});

			const serviceResponse = ServiceResponse.failure(
				`Failed to get experience data: ${error instanceof Error ? error.message : "Unknown error"}`,
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}
	},
);
