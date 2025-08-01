import type { IRouter, Response } from "express";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import {
	type AuthenticatedRequest,
	authenticateToken,
} from "@/common/middleware/auth.js";
import { logger } from "@/common/middleware/requestLogger.js";
import { ServiceContainer } from "@/container/serviceContainer.js";

export const creditsRouter: IRouter = Router();

// Get current user credits balance
creditsRouter.get(
	"/",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.id;
		const userPrefix = req.user?.email?.split("@")[0] ?? "unknown";

		if (!userId) {
			const serviceResponse = ServiceResponse.failure(
				"Invalid user authentication",
				null,
				StatusCodes.UNAUTHORIZED,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		try {
			const container = ServiceContainer.getInstance();
			const creditsRepo = container.getCreditsRepository();
			const credits = await creditsRepo.getCurrentBalance(userId);

			logger.info("Credits balance retrieved", {
				user_id: userId,
				user: userPrefix,
				credits,
			});

			const serviceResponse = ServiceResponse.success(
				"Credits retrieved successfully",
				{ credits },
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			logger.error("Failed to retrieve credits", {
				user_id: userId,
				user: userPrefix,
				error: error instanceof Error ? error.message : "Unknown error",
			});

			const serviceResponse = ServiceResponse.failure(
				"Failed to retrieve credits",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}
	},
);
