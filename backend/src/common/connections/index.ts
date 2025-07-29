/**
 * Connection Managers
 * Centralized management of external service connections with:
 * - Connection pooling and reuse
 * - Health monitoring and retry logic
 * - Rate limiting and backoff strategies
 * - Proper lifecycle management
 */

export { database } from "./databaseConnection.js";
export { geminiConnection } from "./geminiConnection.js";
export { supabaseConnection } from "./supabaseConnection.js";

import { geminiConnection } from "./geminiConnection.js";
import { supabaseConnection } from "./supabaseConnection.js";

// Export connection health check for monitoring
export const getConnectionsHealth = () => {
	return {
		gemini: geminiConnection.getHealthStatus(),
		supabase: supabaseConnection.getHealthStatus(),
		database: true, // TODO: Add health check to database connection
	};
};
