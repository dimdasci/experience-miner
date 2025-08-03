import { z } from "zod";
import "dotenv/config";

// Auth configuration schema for envs - only sensitive data
const authSchema = z.object({
	supabaseUrl: z.string().url().min(1, "Supabase URL is required"),
	supabaseAnonKey: z.string().min(1, "Supabase anon key is required"),
});

// Parse and validate environment variables
const authEnv = authSchema.parse({
	supabaseUrl: process.env.SUPABASE_URL,
	supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
});

export const authConfig = {
	// Sensitive data (from environment)
	supabase: {
		url: authEnv.supabaseUrl,
		anonKey: authEnv.supabaseAnonKey,
		// Operational settings
		options: {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
			db: {
				schema: "public",
			},
			global: {
				headers: {
					"x-application-name": "experience-miner-backend",
				},
			},
		},
	},
};
