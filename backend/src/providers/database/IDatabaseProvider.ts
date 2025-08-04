import type * as E from "fp-ts/lib/Either.js";
import type * as TE from "fp-ts/lib/TaskEither.js";
import type { AppError } from "@/errors";

/**
 * Functional database client interface using TaskEither patterns
 */
export interface DatabaseClient {
	/**
	 * Execute a SQL query with functional error handling
	 */
	query<T>(
		sql: string,
		params?: unknown[],
	): TE.TaskEither<AppError, { rows: T[] }>;

	/**
	 * Extract first row from query result using Either for pure functional composition
	 */
	getFirstRow<T>(
		result: E.Either<AppError, { rows: T[] }>,
	): E.Either<AppError, T>;

	/**
	 * Functional pipeline helper: query and extract first row in one operation
	 */
	queryFirst<T>(sql: string, params?: unknown[]): TE.TaskEither<AppError, T>;

	/**
	 * Release the client connection
	 */
	release(): void;
}

/**
 * Functional Database Provider interface with pure functional error handling
 * All methods use TaskEither and Either patterns for composable error handling
 */
export interface IDatabaseProvider {
	/**
	 * Execute a SQL query with functional error handling
	 */
	query<T>(
		sql: string,
		params?: unknown[],
	): TE.TaskEither<AppError, { rows: T[] }>;

	/**
	 * Extract first row from query result using Either for pure functional composition
	 */
	getFirstRow<T>(
		result: E.Either<AppError, { rows: T[] }>,
	): E.Either<AppError, T>;

	/**
	 * Functional pipeline helper: query and extract first row in one operation
	 */
	queryFirst<T>(sql: string, params?: unknown[]): TE.TaskEither<AppError, T>;

	/**
	 * Get a functional database client for manual connection management
	 */
	getClient(): TE.TaskEither<AppError, DatabaseClient>;

	/**
	 * Execute multiple operations within a transaction with functional error handling
	 */
	transaction<T>(
		callback: (client: DatabaseClient) => TE.TaskEither<AppError, T>,
	): TE.TaskEither<AppError, T>;

	/**
	 * Initialize database connection and perform setup
	 * @returns TaskEither that resolves when initialization is complete
	 */
	initialize(): TE.TaskEither<AppError, void>;

	/**
	 * Close database connections and cleanup resources
	 * @returns TaskEither that resolves when cleanup is complete
	 */
	close(): TE.TaskEither<AppError, void>;

	/**
	 * Health check for database connectivity
	 * @returns TaskEither with boolean indicating database health
	 */
	isHealthy(): TE.TaskEither<AppError, boolean>;
}
