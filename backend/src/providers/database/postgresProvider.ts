import * as Sentry from "@sentry/node";
import * as E from "fp-ts/lib/Either.js";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { Pool, type PoolClient } from "pg";
import { databaseConfig } from "@/config/database.js";
import type { AppError } from "@/errors";
import { AppErrors } from "@/errors";
import type { DatabaseClient, IDatabaseProvider } from "./IDatabaseProvider.js";

/**
 * Functional database client wrapper around pg PoolClient
 */
class FunctionalDatabaseClient implements DatabaseClient {
	constructor(
		private pgClient: PoolClient,
		private provider: PostgresProvider,
	) {}

	query<T>(
		sql: string,
		params?: unknown[],
	): TE.TaskEither<AppError, { rows: T[] }> {
		return TE.tryCatch(
			async () => {
				const result = await this.pgClient.query(sql, params);
				return { rows: result.rows };
			},
			(error) =>
				AppErrors.internalError(
					"Database query failed",
					error instanceof Error ? error.message : error,
				),
		);
	}

	getFirstRow<T>(
		result: E.Either<AppError, { rows: T[] }>,
	): E.Either<AppError, T> {
		return this.provider.getFirstRow(result);
	}

	queryFirst<T>(sql: string, params?: unknown[]): TE.TaskEither<AppError, T> {
		return this.provider.queryFirst<T>(sql, params);
	}

	release(): void {
		this.pgClient.release();
	}
}

/**
 * PostgreSQL Provider implementation using pg connection pool
 * Implements purely functional IDatabaseProvider interface
 */
export class PostgresProvider implements IDatabaseProvider {
	private pool!: Pool;

	constructor() {
		this.initializePool();
	}

	private initializePool(): void {
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
		this.testConnection().catch(() => {
			// Test connection error is already logged in testConnection
		});
	}

	private ensurePoolAvailable(): void {
		if (this.pool.ending === true || this.pool.ended === true) {
			this.initializePool();
		}
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

	// Functional interface implementations

	/**
	 * Execute a SQL query with functional error handling
	 */
	query<T>(
		sql: string,
		params?: unknown[],
	): TE.TaskEither<AppError, { rows: T[] }> {
		return TE.tryCatch(
			async () => {
				// Ensure pool is available before querying
				this.ensurePoolAvailable();

				const client = await this.pool.connect();
				try {
					const result = await client.query(sql, params);
					return { rows: result.rows };
				} finally {
					client.release();
				}
			},
			(error) => {
				// Only capture database errors with Sentry
				Sentry.captureException(error, {
					tags: { component: "db_pool", operation: "query" },
					contexts: { query: { text: sql, params } },
				});
				return AppErrors.internalError(
					"Database query failed",
					error instanceof Error ? error.message : error,
				);
			},
		);
	}

	/**
	 * Extract first row from query result using Either for pure functional composition
	 */
	getFirstRow<T>(
		result: E.Either<AppError, { rows: T[] }>,
	): E.Either<AppError, T> {
		return E.flatMap(result, (queryResult) => {
			if (
				!queryResult.rows ||
				queryResult.rows.length === 0 ||
				!queryResult.rows[0]
			) {
				return E.left(AppErrors.notFound("Row", "first"));
			}
			return E.right(queryResult.rows[0]);
		});
	}

	/**
	 * Get a functional database client for manual connection management
	 */
	getClient(): TE.TaskEither<AppError, DatabaseClient> {
		return TE.tryCatch(
			async () => {
				this.ensurePoolAvailable();
				const pgClient = await this.pool.connect();
				return new FunctionalDatabaseClient(pgClient, this);
			},
			(error) =>
				AppErrors.internalError(
					"Failed to get database client",
					error instanceof Error ? error.message : error,
				),
		);
	}

	/**
	 * Execute multiple operations within a transaction with functional error handling
	 */
	transaction<T>(
		callback: (client: DatabaseClient) => TE.TaskEither<AppError, T>,
	): TE.TaskEither<AppError, T> {
		return pipe(
			this.getClient(),
			TE.flatMap((client) => {
				const cleanup = () => client.release();

				return pipe(
					// Begin transaction
					client.query("BEGIN"),
					TE.flatMap(() => callback(client)),
					TE.flatMap((result) =>
						pipe(
							// Commit transaction
							client.query("COMMIT"),
							TE.map(() => {
								cleanup();
								return result;
							}),
						),
					),
					TE.mapLeft((error) => {
						// Rollback on error (fire and forget)
						client.query("ROLLBACK")();
						cleanup();
						return error;
					}),
				);
			}),
		);
	}

	/**
	 * Initialize database connection and perform setup
	 */
	initialize(): TE.TaskEither<AppError, void> {
		return TE.tryCatch(
			async () => {
				this.ensurePoolAvailable();
				const result = await this.query("SELECT 1")();
				if (result._tag === "Left") {
					throw result.left;
				}
			},
			(error) =>
				AppErrors.internalError(
					`PostgreSQL initialization failed: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				),
		);
	}

	/**
	 * Close database connections and cleanup resources
	 */
	close(): TE.TaskEither<AppError, void> {
		return TE.tryCatch(
			async () => {
				// Check if pool is already ended
				if (this.pool.ending === true) {
					return;
				}
				await this.pool.end();
			},
			(error) =>
				AppErrors.internalError(
					"Failed to close database connections",
					error instanceof Error ? error.message : error,
				),
		);
	}

	/**
	 * Functional pipeline helper: query and extract first row in one operation
	 */
	queryFirst<T>(sql: string, params?: unknown[]): TE.TaskEither<AppError, T> {
		return pipe(
			this.query<T>(sql, params), // returns TaskEither because it's an async database call
			// getFirstRow() uses Either, so
			// we need TE.fromEither to to lift the synchronous Either result into the async TaskEither context
			TE.flatMap((result) => TE.fromEither(this.getFirstRow(E.right(result)))),
		);
	}

	/**
	 * Health check for database connectivity
	 */
	isHealthy(): TE.TaskEither<AppError, boolean> {
		return pipe(
			this.query("SELECT 1"),
			TE.map(() => true),
			TE.orElse(() => TE.right(false)),
		);
	}
}
