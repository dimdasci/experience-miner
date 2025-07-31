/**
 * Connection Managers
 * Centralized management of external service connections with:
 * - Connection pooling and reuse
 * - Health monitoring and retry logic
 * - Rate limiting and backoff strategies
 * - Proper lifecycle management
 */

export { supabaseConnection } from "./supabaseConnection.js";

import { supabaseConnection } from "./supabaseConnection.js";

// Export connection health check for monitoring
export const getConnectionsHealth = () => {
	return {
		supabase: supabaseConnection.getHealthStatus(),
	};
};
