import rateLimit from "express-rate-limit";
import { serverConfig } from "@/config";

// General API rate limiting
export const rateLimiter = rateLimit({
	windowMs: serverConfig.rateLimiting.general.windowMs,
	max: serverConfig.rateLimiting.general.max,
	message: {
		error: serverConfig.rateLimiting.general.message,
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Stricter rate limiting for AI-powered endpoints
export const aiRateLimiter = rateLimit({
	windowMs: serverConfig.rateLimiting.ai.windowMs,
	max: serverConfig.rateLimiting.ai.max,
	message: {
		error: serverConfig.rateLimiting.ai.message,
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (_req) => {
		// Skip rate limiting in development
		return serverConfig.nodeEnv === "development";
	},
});
