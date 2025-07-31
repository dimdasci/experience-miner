
import { Pool } from "pg";
import { databaseConfig } from "@/config/database.js";
import { logger } from "@/common/middleware/requestLogger.js";
import type { IDatabaseProvider, DatabaseClient } from "@/interfaces/providers/index.js";

/**
 * PostgreSQL Provider implementation using pg connection pool
 * Implements IDatabaseProvider interface
 */
export class PostgresProvider implements IDatabaseProvider {
	private pool: Pool;
/**
 * Helper to extract first row or throw error if not found
 */
getFirstRowOrThrow<T>(result: { rows: T[] }, errorMessage: string): T {
	if (!result.rows || result.rows.length === 0 || !result.rows[0]) {
		throw new Error(errorMessage);
	}
	return result.rows[0];
}

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

	async query<T>(
		text: string,
		params: unknown[] = [],
	): Promise<{ rows: T[]}> {
		const client = await this.pool.connect();
		try {
			const result = await client.query(text, params);
			return { rows: result.rows };
		} finally {
			client.release();
		}
	}

	async getClient(): Promise<DatabaseClient> {
		return await this.pool.connect();
	}

	async transaction<T>(
		callback: (client: DatabaseClient) => Promise<T>,
	): Promise<T> {
		// Always pass a real PoolClient from pg
		const client: DatabaseClient = await this.pool.connect();
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

	async initialize(): Promise<void> {
		try {
			await this.query("SELECT 1");
		} catch (error) {
			throw new Error(
				`PostgreSQL initialization failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	async close(): Promise<void> {
		await this.pool.end();
		logger.info("Database pool closed");
	}

	async isHealthy(): Promise<boolean> {
		try {
			await this.query("SELECT 1");
			return true;
		} catch {
			return false;
		}
	}
}
