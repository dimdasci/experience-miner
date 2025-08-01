import * as Sentry from "@sentry/node";
import { Pool } from "pg";
import { logger } from "@/common/middleware/requestLogger.js";
import { databaseConfig } from "@/config/database.js";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";

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
		logger.info("Creating new PostgreSQL connection pool");
		this.pool = new Pool({
			...databaseConfig.connection,
			...databaseConfig.pool,
		});
		
		// Add event handlers to track pool behavior
		this.pool.on('error', (err) => {
			logger.error("Unexpected PostgreSQL pool error", {
				error: err.message,
				stack: err.stack
			});
			Sentry.captureException(err, {
				tags: { component: "db_pool" }
			});
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

	async query<T>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
		// Check if pool is already ended before attempting to connect
		if (this.pool['ending'] === true) {
			const error = new Error('Cannot use a pool after calling end on the pool');
			logger.error("Attempted to use closed PostgreSQL pool", {
				query: text,
				error: error.message,
				stack: error.stack
			});
			Sentry.captureException(error, {
				tags: { component: "db_pool", operation: "query" },
				contexts: { query: { text, params } }
			});
			throw error;
		}
		
		try {
			const client = await this.pool.connect();
			try {
				const result = await client.query(text, params);
				return { rows: result.rows };
			} finally {
				client.release();
			}
		} catch (error) {
			logger.error("Database query error", {
				query: text,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});
			Sentry.captureException(error, {
				tags: { component: "db_pool", operation: "query" },
				contexts: { query: { text, params } }
			});
			throw error;
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
		logger.info("Closing PostgreSQL connection pool", {
			stack: new Error().stack, // Log the call stack to see where close() is being called from
		});
		
		// Check if pool is already ended
		if (this.pool['ending'] === true) {
			logger.warn("Attempted to close PostgreSQL pool that is already ending/ended");
			return;
		}
		
		// Track active clients before ending
		const poolStatus = {
			totalCount: this.pool.totalCount,
			idleCount: this.pool.idleCount,
			waitingCount: this.pool.waitingCount,
		};
		logger.info("Pool status before closing", poolStatus);
		
		await this.pool.end();
		logger.info("Database pool closed successfully");
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
