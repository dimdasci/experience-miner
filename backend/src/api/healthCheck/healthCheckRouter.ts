import type { Request, Response } from "express";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse.js";

export const healthCheckRouter: Router = Router();

healthCheckRouter.get("/", (_req: Request, res: Response) => {
	const serviceResponse = ServiceResponse.success("Service is healthy", {
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});

	return res.status(serviceResponse.statusCode).json(serviceResponse);
});

// Railway-specific health check endpoint
healthCheckRouter.get("/railway", (_req: Request, res: Response) => {
	return res.status(StatusCodes.OK).json({
		status: "healthy",
		service: "experience-miner-backend",
		timestamp: new Date().toISOString(),
	});
});
