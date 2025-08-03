import { z } from "zod";
import "dotenv/config";

// Server configuration schema
const serverSchema = z.object({
	port: z.coerce.number().int().positive().default(8080),
	nodeEnv: z.enum(["development", "staging", "production", "test"]),
	logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
	frontendUrl: z.string().optional(),
	railwayEnvironmentName: z.string().optional(),
	railwayPublicDomain: z.string().optional(),
	aiProvider: z.string().default("google"),
	databaseProvider: z.string().default("postgres"),
	// Rate limiting
	rateLimitGeneralMax: z.coerce.number().int().positive().default(100),
	rateLimitGeneralWindowMs: z.coerce.number().int().positive().default(60000),
	rateLimitAiMax: z.coerce.number().int().positive().default(10),
	rateLimitAiWindowMs: z.coerce.number().int().positive().default(60000),
});

// Parse and validate environment variables
const serverEnv = serverSchema.parse({
	port: process.env.PORT,
	nodeEnv:
		process.env.RAILWAY_ENVIRONMENT_NAME ||
		process.env.NODE_ENV ||
		"development",
	logLevel: process.env.LOG_LEVEL,
	frontendUrl: process.env.FRONTEND_URL,
	railwayEnvironmentName: process.env.RAILWAY_ENVIRONMENT_NAME,
	railwayPublicDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
	aiProvider: process.env.AI_PROVIDER,
	databaseProvider: process.env.DATABASE_PROVIDER,
	// Rate limiting from env vars
	rateLimitGeneralMax: process.env.RATE_LIMIT_GENERAL_MAX,
	rateLimitGeneralWindowMs: process.env.RATE_LIMIT_GENERAL_WINDOW_MS,
	rateLimitAiMax: process.env.RATE_LIMIT_AI_MAX,
	rateLimitAiWindowMs: process.env.RATE_LIMIT_AI_WINDOW_MS,
});

export const serverConfig = {
	port: serverEnv.port,
	nodeEnv: serverEnv.nodeEnv,
	logLevel: serverEnv.logLevel,
	aiProvider: serverEnv.aiProvider,
	databaseProvider: serverEnv.databaseProvider,

	// CORS configuration
	cors: {
		frontendUrl: serverEnv.frontendUrl,
		allowedOrigins: serverEnv.frontendUrl
			? [serverEnv.frontendUrl]
			: ["http://localhost:3000", "http://localhost:5173"], // Development defaults
	},

	// Railway deployment
	railway: {
		environmentName: serverEnv.railwayEnvironmentName,
		publicDomain: serverEnv.railwayPublicDomain,
	},

	// Express configuration
	express: {
		trustProxy: true, // For Railway deployment
		jsonLimit: "10mb",
		urlEncodedLimit: "10mb",
	},

	// Rate limiting configuration
	rateLimiting: {
		general: {
			windowMs: serverEnv.rateLimitGeneralWindowMs,
			max: serverEnv.rateLimitGeneralMax,
			message: "Too many requests from this IP, please try again later.",
		},
		ai: {
			windowMs: serverEnv.rateLimitAiWindowMs,
			max: serverEnv.rateLimitAiMax,
			message:
				"Too many AI processing requests, please wait before trying again.",
		},
	},
};
