import * as Sentry from "@sentry/node";
import cors from "cors";
import type { Application } from "express";
import express from "express";
import helmet from "helmet";
import { creditsRouter } from "@/api/credits/creditsRouter.js";
import { experienceRouter } from "@/api/experience/experienceRouter.js";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter.js";
import { interviewRouter } from "@/api/interview/interviewRouter.js";
import { topicsRouter } from "@/api/topics/topicsRouter.js";
import { serverConfig } from "@/config/server.js";
import { errorHandler } from "@/middleware/errorHandler.js";
import { aiRateLimiter, rateLimiter } from "@/middleware/rateLimiter.js";
import { deduplicateRequests } from "@/middleware/requestDeduplication.js";
import { requestLogger } from "@/middleware/requestLogger.js";

const app: Application = express();

// Trust proxy for Railway deployment (fixes rate limiting and IP detection)
app.set("trust proxy", true);

// Security middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"],
			},
		},
	}),
);

// CORS configuration
app.use(
	cors({
		origin:
			serverConfig.nodeEnv === "development"
				? serverConfig.cors.allowedOrigins
				: serverConfig.cors.frontendUrl
					? [`https://${serverConfig.cors.frontendUrl}`]
					: false,
		credentials: true,
	}),
);

// Request parsing
app.use(express.json({ limit: serverConfig.express.jsonLimit }));
app.use(
	express.urlencoded({
		extended: true,
		limit: serverConfig.express.urlEncodedLimit,
	}),
);

// Request logging
app.use(requestLogger);

// Request deduplication
app.use(deduplicateRequests);

// Rate limiting
app.use(rateLimiter);

// Routes
app.use("/health", healthCheckRouter);
app.use("/api/credits", creditsRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/interview", aiRateLimiter, interviewRouter);
app.use("/api/experience", experienceRouter);

// Root endpoint
app.get("/", (_req, res) => {
	res.json({
		message: "Experience Miner API",
		version: "0.1.0",
		health: "/health",
		endpoints: {
			credits: "GET /api/credits",
			topics: "GET /api/topics, POST /api/topics/{id}/select",
			interviews:
				"GET /api/interview, GET /api/interview/{id}, PUT /api/interview/{id}/answers/{questionNumber}",
			transcribe: "POST /api/interview/transcribe",
			extract: "POST /api/interview/{id}/extract",
			experience: "GET /api/experience",
		},
	});
});

// The Sentry error handler must be registered before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Error handling (must be last)
app.use(errorHandler);

export { app };
