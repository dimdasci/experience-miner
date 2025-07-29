import type { IDatabaseProvider } from "@/interfaces/providers/index.js";

/**
 * Mock Database Provider for testing and development
 * Stores data in memory without external database dependencies
 */
export class MockDatabaseProvider implements IDatabaseProvider {
	private data: Map<string, any[]>;
	private sequences: Map<string, number>;
	private shouldFail: boolean;

	constructor(shouldFail = false) {
		this.data = new Map();
		this.sequences = new Map();
		this.shouldFail = shouldFail;
		this.initializeTestData();
	}

	/**
	 * Configure provider to simulate failures
	 */
	setShouldFail(shouldFail: boolean): void {
		this.shouldFail = shouldFail;
	}

	/**
	 * Get current data for a table (for testing/debugging)
	 */
	getTableData(tableName: string): any[] {
		return this.data.get(tableName) || [];
	}

	/**
	 * Clear all data (for test cleanup)
	 */
	clearAll(): void {
		this.data.clear();
		this.sequences.clear();
		this.initializeTestData();
	}

	async query<T>(sql: string, params: any[] = []): Promise<T[]> {
		if (this.shouldFail) {
			throw new Error("Mock database query failure");
		}

		// Simple SQL parsing for common operations
		const sqlLower = sql.toLowerCase().trim();

		if (sqlLower.startsWith("select")) {
			return this.handleSelect<T>(sql, params);
		} else if (sqlLower.startsWith("insert")) {
			return this.handleInsert<T>(sql, params);
		} else if (sqlLower.startsWith("update")) {
			return this.handleUpdate<T>(sql, params);
		} else if (sqlLower.startsWith("delete")) {
			return this.handleDelete<T>(sql, params);
		}

		// Default return for unhandled queries
		return [] as T[];
	}

	async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
		if (this.shouldFail) {
			throw new Error("Mock database transaction failure");
		}

		// Mock transaction client - just passes through to this provider
		const mockClient = {
			query: this.query.bind(this),
		};

		return await callback(mockClient);
	}

	async getClient(): Promise<any> {
		if (this.shouldFail) {
			throw new Error("Mock database client failure");
		}

		return {
			query: this.query.bind(this),
			release: () => Promise.resolve(),
		};
	}

	async initialize(): Promise<void> {
		if (this.shouldFail) {
			throw new Error("Mock database initialization failure");
		}
		// Already initialized in constructor
		return Promise.resolve();
	}

	async close(): Promise<void> {
		// Nothing to close for in-memory provider
		return Promise.resolve();
	}

	async isHealthy(): Promise<boolean> {
		return !this.shouldFail;
	}

	private initializeTestData(): void {
		// Initialize with some test data
		this.data.set("topics", []);
		this.data.set("interviews", []);
		this.data.set("answers", []);
		this.data.set("credits", []);
		this.data.set("experience", []);

		this.sequences.set("topics", 1);
		this.sequences.set("interviews", 1);
	}

	private handleSelect<T>(sql: string, params: any[]): T[] {
		// Extract table name from SELECT statement
		const tableMatch = sql.match(/from\\s+(\\w+)/i);
		if (!tableMatch) return [];

		const tableName = tableMatch[1];
		const tableData = this.data.get(tableName) || [];

		// Simple WHERE clause handling for common patterns
		if (sql.includes("WHERE")) {
			return this.applyWhereClause<T>(tableData, sql, params);
		}

		return tableData as T[];
	}

	private handleInsert<T>(sql: string, params: any[]): T[] {
		// Extract table name
		const tableMatch = sql.match(/insert\\s+into\\s+(\\w+)/i);
		if (!tableMatch) return [];

		const tableName = tableMatch[1];
		const tableData = this.data.get(tableName) || [];

		// Create mock record
		const record: any = {};

		// Handle common patterns for each table
		if (tableName === "topics") {
			record.id = this.getNextId(tableName);
			record.user_id = params[0];
			record.title = params[1];
			record.motivational_quote = params[2];
			record.questions =
				typeof params[3] === "string" ? JSON.parse(params[3]) : params[3];
			record.status = params[4];
			record.created_at = new Date().toISOString();
			record.updated_at = new Date().toISOString();
		} else if (tableName === "interviews") {
			record.id = this.getNextId(tableName);
			record.user_id = params[0];
			record.title = params[1];
			record.motivational_quote = params[2];
			record.status = "draft";
			record.created_at = new Date().toISOString();
			record.updated_at = new Date().toISOString();
		} else if (tableName === "answers") {
			record.id = `answer-${Date.now()}`;
			record.interview_id = params[0];
			record.user_id = params[1];
			record.question_number = params[2];
			record.question = params[3];
			record.answer = null;
			record.recording_duration_seconds = null;
			record.created_at = new Date().toISOString();
			record.updated_at = new Date().toISOString();
		} else if (tableName === "credits") {
			record.id = `credit-${Date.now()}`;
			record.user_id = params[0];
			record.amount = params[1];
			record.source_amount = params[2];
			record.source_type = params[3];
			record.source_unit = params[4];
			record.created_at = new Date().toISOString();
		}

		tableData.push(record);
		this.data.set(tableName, tableData);

		// Return the created record
		return [record] as T[];
	}

	private handleUpdate<T>(sql: string, _params: any[]): T[] {
		// Simple update handling - would need more sophisticated parsing for production
		const tableMatch = sql.match(/update\\s+(\\w+)/i);
		if (!tableMatch) return [];

		const tableName = tableMatch[1];
		const _tableData = this.data.get(tableName) || [];

		// For mock purposes, just return success
		return [{ success: true }] as T[];
	}

	private handleDelete<T>(_sql: string, _params: any[]): T[] {
		// Simple delete handling
		return [{ success: true }] as T[];
	}

	private applyWhereClause<T>(data: any[], sql: string, params: any[]): T[] {
		// Simple WHERE clause handling for common patterns
		if (sql.includes("user_id = $1")) {
			return data.filter((row) => row.user_id === params[0]) as T[];
		}
		if (sql.includes("id = $1")) {
			return data.filter((row) => row.id === params[0]) as T[];
		}
		if (sql.includes("interview_id = $1")) {
			return data.filter((row) => row.interview_id === params[0]) as T[];
		}

		return data as T[];
	}

	private getNextId(tableName: string): number {
		const current = this.sequences.get(tableName) || 1;
		this.sequences.set(tableName, current + 1);
		return current;
	}
}
