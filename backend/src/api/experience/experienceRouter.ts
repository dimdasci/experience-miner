import * as Sentry from "@sentry/node";
import type { IRouter } from "express";
import { type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { authenticateToken } from "@/common/middleware/auth.js";
import { ServiceContainer } from "@/container/serviceContainer.js";

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
				component: "ExperienceRouter",
			});

			const container = ServiceContainer.getInstance();
			const experienceRepo = container.getExperienceRepository();
			const experienceRecord =
				await experienceRepo.getByUserId(userId);

			if (!experienceRecord) {
				Sentry.logger?.warn?.("Experience data record not found", {
					user_id: userId,
					hasData: false,
					component: "ExperienceRouter",
				});

				const serviceResponse = ServiceResponse.failure(
					"Experience data is not found",
					null,
					StatusCodes.NOT_FOUND,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			Sentry.logger?.info?.("Experience data retrieved successfully", {
				user_id: userId,
				hasData: true,
				component: "ExperienceRouter",
			});

			// Get the stored extracted facts - stored in summary.extractedFacts per database schema
			const storedFacts = experienceRecord.payload;

			// Handle case where extractedFacts might not exist yet
			if (!storedFacts) {
				Sentry.logger?.warn?.(
					"Experience data record has empty payload",
					{
						user_id: userId,
						hasData: false,
						component: "ExperienceRouter",
					},
				);

				const serviceResponse = ServiceResponse.failure(
					"Experience data retrieved (empty)",
					null,
					StatusCodes.NOT_FOUND,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			// Data is already in the correct unified format - return as is
			const serviceResponse = ServiceResponse.success(
				"Experience data retrieved successfully",
				{ extractedFacts: storedFacts },
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			// Track error with full context
			Sentry.captureException(error, {
				tags: { endpoint: "experience", operation: "get_experience_data" },
				contexts: {
					user: { id: userId },
					request: { endpoint: "GET /api/experience" },
					operation: {
						name: "getExperienceByUserId",
						component: "ExperienceRouter",
					},
				},
			});
			// Supplementary logging for user journey analysis
			Sentry.logger?.error?.("Experience data retrieval failed", {
				user_id: userId,
				endpoint: "GET /api/experience",
				error: error instanceof Error ? error.message : String(error),
				component: "ExperienceRouter",
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
