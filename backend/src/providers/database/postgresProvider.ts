import type { PoolClient } from "pg";
import { database } from "@/common/connections/databaseConnection.js";
import type { IDatabaseProvider } from "@/interfaces/providers/index.js";

/**
 * PostgreSQL Provider implementation using pg connection pool
 * Handles query execution, transactions, and connection management
 */
export class PostgresProvider implements IDatabaseProvider {
	async query<T>(sql: string, params?: any[]): Promise<T[]> {
		return await database.query<T>(sql, params);
	}

	async transaction<T>(
		callback: (client: PoolClient) => Promise<T>,
	): Promise<T> {
		return await database.transaction<T>(callback);
	}

	async getClient(): Promise<PoolClient> {
		return await database.getClient();
	}

	async initialize(): Promise<void> {
		// Database initialization is handled by the existing database utility
		// This could be expanded to include schema migrations, etc.
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
		// Connection cleanup is handled by the existing database utility
		// This could be expanded to include proper pool cleanup
		return Promise.resolve();
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
