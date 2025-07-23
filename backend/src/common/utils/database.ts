import { Pool, type PoolClient } from "pg";
import { logger } from "../middleware/requestLogger.js";
import { env } from "./envConfig.js";

class DatabaseService {
	private pool: Pool;

	constructor() {
		this.pool = new Pool({
			host: env.SUPABASE_POSTGRESS_HOST,
			port: env.SUPABASE_POSTGRESS_PORT,
			database: env.SUPABASE_POSTGRESS_DATABASE,
			user: env.SUPABASE_POSTGRESS_USER,
			password: env.SUPABASE_POSTGRESS_PASSWORD,
			ssl: {
				rejectUnauthorized: false,
			},
			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
		});

		// Test connection on startup
		this.testConnection();
	}

	private async testConnection(): Promise<void> {
		try {
			const client = await this.pool.connect();
			const result = await client.query("SELECT NOW()");
			client.release();
			logger.info("Database connection established successfully", {
				timestamp: result.rows[0].now,
			});
		} catch (error) {
			logger.error("Failed to connect to database", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	async query<T = Record<string, unknown>>(
		text: string,
		params: unknown[] = [],
	): Promise<T[]> {
		const client = await this.pool.connect();
		try {
			const result = await client.query(text, params);
			return result.rows;
		} finally {
			client.release();
		}
	}

	async transaction<T>(
		callback: (client: PoolClient) => Promise<T>,
	): Promise<T> {
		const client = await this.pool.connect();
		try {
			await client.query("BEGIN");
			const result = await callback(client);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	async close(): Promise<void> {
		await this.pool.end();
		logger.info("Database pool closed");
	}
}

export const database = new DatabaseService();
