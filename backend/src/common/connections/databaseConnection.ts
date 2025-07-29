import { Pool, type PoolClient } from "pg";
import { databaseConfig } from "@/config/database.js";
import { logger } from "../middleware/requestLogger.js";

class DatabaseService {
	private pool: Pool;

	constructor() {
		this.pool = new Pool({
			...databaseConfig.connection,
			...databaseConfig.pool,
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

	async getClient(): Promise<PoolClient> {
		return await this.pool.connect();
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
