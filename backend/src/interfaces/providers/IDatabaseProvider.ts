/**
 * Generic database client interface for different implementations
 */
export interface DatabaseClient {
	query<T>(sql: string, params?: unknown[]): Promise<T[] | { rows: T[] }>;
	release?(): void;
}

/**
 * Database Provider interface for abstracting different database implementations
 * Supports query execution, transactions, and connection management
 */
export interface IDatabaseProvider {
	/**
	 * Execute a SQL query with optional parameters
	 * @param sql - The SQL query string
	 * @param params - Optional query parameters
	 * @returns Promise with query results
	 */
	query<T>(sql: string, params?: unknown[]): Promise<T[]>;

	/**
	 * Execute multiple operations within a database transaction
	 * @param callback - Function to execute within transaction
	 * @returns Promise with transaction result
	 */
	transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>;

	/**
	 * Get a database client for manual connection management
	 * @returns Promise with database client
	 */
	getClient(): Promise<DatabaseClient>;

	/**
	 * Initialize database connection and perform setup
	 * @returns Promise that resolves when initialization is complete
	 */
	initialize(): Promise<void>;

	/**
	 * Close database connections and cleanup resources
	 * @returns Promise that resolves when cleanup is complete
	 */
	close(): Promise<void>;

	/**
	 * Health check for database connectivity
	 * @returns Promise with boolean indicating database health
	 */
	isHealthy(): Promise<boolean>;
}
