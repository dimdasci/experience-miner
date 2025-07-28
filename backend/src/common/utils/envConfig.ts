import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	// Railway provides environment name, fallback to development for local dev
	RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
	PORT: z.coerce.number().int().positive().default(8080),

	// Gemini AI Configuration
	API_KEY: z.string().min(1, "Gemini API key is required"),

	// AI Model Configuration
	LLM_TRANSCRIPTION_MODEL: z.string().default("gemini-2.5-flash"),
	LLM_EXTRACTION_MODEL: z.string().default("gemini-2.5-flash"),
	LLM_TOPIC_GENERATION_MODEL: z.string().default("gemini-2.5-flash"),
	LLM_TOPIC_RERANKING_MODEL: z.string().default("gemini-2.5-flash"),

	// CORS Configuration - Frontend URL (set via Railway service reference)
	FRONTEND_URL: z.string().optional(),

	// Railway Configuration (automatically provided by Railway)
	RAILWAY_PUBLIC_DOMAIN: z.string().optional(),

	// Supabase Configuration (required for authentication)
	SUPABASE_URL: z.string().url().min(1, "Supabase URL is required"),
	SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),

	// Logging
	LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

	// Sentry Configuration
	SENTRY_DSN_BACKEND: z.string().optional(),
	SENTRY_ENVIRONMENT: z.string().default("development"),
	SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1.0),

	// Credits Configuration
	TRANSCRIBER_CREDIT_RATE: z.coerce.number().positive().default(2.5),
	EXTRACTOR_CREDIT_RATE: z.coerce.number().positive().default(1.0),
	TOPIC_GENERATION_RATE: z.coerce.number().positive().default(0.8),
	TOPIC_RERANKING_RATE: z.coerce.number().positive().default(0.8),

	// Supabase Postgres Direct Connection
	SUPABASE_POSTGRESS_HOST: z
		.string()
		.min(1, "Supabase Postgres host is required"),
	SUPABASE_POSTGRESS_PORT: z.coerce.number().int().positive().default(5432),
	SUPABASE_POSTGRESS_PASSWORD: z
		.string()
		.min(1, "Supabase Postgres password is required"),
	SUPABASE_POSTGRESS_USER: z
		.string()
		.min(1, "Supabase Postgres user is required"),
	SUPABASE_POSTGRESS_DATABASE: z
		.string()
		.min(1, "Supabase Postgres database is required"),
});

type BaseEnvConfig = z.infer<typeof envSchema>;

function validateEnv(): BaseEnvConfig {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.errors.map(
				(err) => `${err.path.join(".")}: ${err.message}`,
			);

			console.error("❌ Environment validation failed:");
			errorMessages.forEach((msg) => console.error(`  - ${msg}`));
			process.exit(1);
		}

		console.error("❌ Unexpected error during environment validation:", error);
		process.exit(1);
	}
}

const baseEnv = validateEnv();

// Use Railway environment name or default to development for local
const NODE_ENV = baseEnv.RAILWAY_ENVIRONMENT_NAME || "development";

export const env = {
	...baseEnv,
	NODE_ENV,
	isDevelopment: NODE_ENV === "development",
	isProduction: NODE_ENV === "production",
};

export type EnvConfig = typeof env;

// Log configuration
console.log("🔧 Environment configuration:");
console.log(
	`  - RAILWAY_ENVIRONMENT_NAME: ${env.RAILWAY_ENVIRONMENT_NAME || "⚠️  Not set (local dev)"}`,
);
console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
console.log(`  - PORT: ${env.PORT}`);
console.log(`  - LOG_LEVEL: ${env.LOG_LEVEL}`);
console.log(`  - API_KEY: ${env.API_KEY ? "✅ Set" : "❌ Missing"}`);
console.log(`  - LLM_TRANSCRIPTION_MODEL: ${env.LLM_TRANSCRIPTION_MODEL}`);
console.log(`  - LLM_EXTRACTION_MODEL: ${env.LLM_EXTRACTION_MODEL}`);
console.log(
	`  - LLM_TOPIC_GENERATION_MODEL: ${env.LLM_TOPIC_GENERATION_MODEL}`,
);
console.log(`  - LLM_TOPIC_RERANKING_MODEL: ${env.LLM_TOPIC_RERANKING_MODEL}`);
console.log(
	`  - FRONTEND_URL: ${env.FRONTEND_URL || "⚠️  Not set (using localhost)"}`,
);
console.log(
	`  - RAILWAY_PUBLIC_DOMAIN: ${env.RAILWAY_PUBLIC_DOMAIN || "⚠️  Not set (local dev)"}`,
);
console.log(`  - SUPABASE_URL: ${env.SUPABASE_URL ? "✅ Set" : "❌ Missing"}`);
console.log(
	`  - SUPABASE_ANON_KEY: ${env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}`,
);
console.log(
	`  - SENTRY_DSN_BACKEND: ${env.SENTRY_DSN_BACKEND ? "✅ Set" : "⚠️  Optional (not set)"}`,
);
console.log(`  - SENTRY_ENVIRONMENT: ${env.SENTRY_ENVIRONMENT}`);
console.log(`  - SENTRY_TRACES_SAMPLE_RATE: ${env.SENTRY_TRACES_SAMPLE_RATE}`);
console.log(`  - TRANSCRIBER_CREDIT_RATE: ${env.TRANSCRIBER_CREDIT_RATE}`);
console.log(`  - EXTRACTOR_CREDIT_RATE: ${env.EXTRACTOR_CREDIT_RATE}`);
console.log(`  - TOPIC_GENERATION_RATE: ${env.TOPIC_GENERATION_RATE}`);
console.log(`  - TOPIC_RERANKING_RATE: ${env.TOPIC_RERANKING_RATE}`);
console.log(
	`  - SUPABASE_POSTGRESS_HOST: ${env.SUPABASE_POSTGRESS_HOST ? "✅ Set" : "❌ Missing"}`,
);
console.log(
	`  - SUPABASE_POSTGRESS_DATABASE: ${env.SUPABASE_POSTGRESS_DATABASE ? "✅ Set" : "❌ Missing"}`,
);

if (env.NODE_ENV !== "development" && !env.FRONTEND_URL) {
	console.warn(
		"⚠️  FRONTEND_URL not set in deployed environment - CORS will be disabled",
	);
}
