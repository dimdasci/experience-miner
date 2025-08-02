import * as Sentry from "@sentry/node";
import { Pool } from "pg";
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
		this.pool = new Pool({
			...databaseConfig.connection,
			...databaseConfig.pool,
		});

		// Add event handlers to track critical pool errors
		this.pool.on("error", (err) => {
			Sentry.captureException(err, {
				tags: { component: "db_pool" },
			});
		});

		// Test connection on startup
		this.testConnection();
	}

	private async testConnection(): Promise<void> {
		try {
			const client = await this.pool.connect();
			await client.query("SELECT NOW()");
			client.release();
		} catch (error) {
			Sentry.captureException(error, {
				tags: { component: "db_pool", operation: "initialize" },
			});
		}
	}

	async query<T>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
		// Check if pool is already ended before attempting to connect
		if (this.pool.ending === true) {
			const error = new Error(
				"Cannot use a pool after calling end on the pool",
			);
			// Use Sentry only for critical errors
			Sentry.captureException(error, {
				tags: { component: "db_pool", operation: "query" },
				contexts: { query: { text, params } },
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
			// Only capture database errors with Sentry
			Sentry.captureException(error, {
				tags: { component: "db_pool", operation: "query" },
				contexts: { query: { text, params } },
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
		// Check if pool is already ended
		if (this.pool.ending === true) {
			return;
		}

		await this.pool.end();
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
