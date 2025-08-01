import { z } from "zod";
import "dotenv/config";

// Database configuration schema - sensitive connection details
const databaseSchema = z.object({
	host: z.string().min(1, "Supabase Postgres host is required"),
	port: z.coerce.number().int().positive().default(5432),
	database: z.string().min(1, "Supabase Postgres database is required"),
	user: z.string().min(1, "Supabase Postgres user is required"),
	password: z.string().min(1, "Supabase Postgres password is required"),
});

// Parse and validate environment variables
const databaseEnv = databaseSchema.parse({
	host: process.env.SUPABASE_POSTGRESS_HOST,
	port: process.env.SUPABASE_POSTGRESS_PORT,
	database: process.env.SUPABASE_POSTGRESS_DATABASE,
	user: process.env.SUPABASE_POSTGRESS_USER,
	password: process.env.SUPABASE_POSTGRESS_PASSWORD,
});

export const databaseConfig = {
	// Sensitive connection details (from environment)
	connection: {
		host: databaseEnv.host,
		port: databaseEnv.port,
		database: databaseEnv.database,
		user: databaseEnv.user,
		password: databaseEnv.password,
		ssl: {
			rejectUnauthorized: false,
		},
	},

	// Operational settings
	pool: {
		max: 20,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000,
	},
};
